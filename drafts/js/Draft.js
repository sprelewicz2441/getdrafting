export default class Draft {
  constructor(prospects) {
    this.prospects = prospects;
    this.current_pick_num = 1;
    this.current_round = 1;
    this.teamGM = '';

    // Attach game sounds
    this.sounds = [];
    this.sounds.start_sound = document.createElement("audio");
    this.sounds.start_sound.src = '/assets/draft-intro.mp3';
    this.sounds.start_sound.setAttribute("preload", "auto");
    this.sounds.start_sound.setAttribute("controls", "none");
    this.sounds.start_sound.style.display = "none";
    document.body.appendChild(this.sounds.start_sound);

    this.sounds.user_pick_sound = document.createElement("audio");
    this.sounds.user_pick_sound.src = '/assets/chime-synth.mp3';
    this.sounds.user_pick_sound.setAttribute("preload", "auto");
    this.sounds.user_pick_sound.setAttribute("controls", "none");
    this.sounds.user_pick_sound.style.display = "none";
    document.body.appendChild(this.sounds.user_pick_sound);
  }

  init() {
    this.getData('draftmetadata2022.json').then(val => {
      this.metadata = val;
      this.round_turnovers = []; 
      this.metadata.round_pick_turnover.forEach((row, index) => {
        this.round_turnovers.push(row.pick);
      });
    });
    this.getData('draftorder2022.json').then(val => {
      this.draftorder = val;
    });
    this.getData('teamneeds2022.json').then(val => {
      this.teamneeds = val;
    });
  }

  showSplash() {
    this.hideTeamSelect();
    this.sounds.start_sound.play();
    document.querySelector('#draft-splash-screen').style.display = 'block';

    let self = this;
    setTimeout(function() { 
      self.hideSplash();
      self.showMainDraftScreen();
      self.runDraft();
    }, 15000);
    
  }

  hideSplash() {
    document.querySelector('#draft-splash-screen').style.display = 'none';
  }

  startDraft(teamGM) {
    if(teamGM === '') {
      console.log("No team selected");
      return;
    }

    this.teamGM = teamGM;
    this.populateAvailableProspects();
    this.showSplash();
    document.querySelector('#draft-dialog').innerHTML = "You are drafting as the <strong>" + this.capitalizeTeam(this.teamGM) + "</strong>";
    
  }

  hideTeamSelect() {
    document.querySelector('#start-screen').style.display = 'none';
  }

  showMainDraftScreen() {
    document.querySelector('#main-draft-screen').style.display = 'block';
  }

  populateAvailableProspects() {
    let prospectBox = document.querySelector("#available-prospect-list");

    this.prospects.forEach(prospect => {
      let rowWrapper = document.createElement('div');
      rowWrapper.classList.add('prospect-info-row');
      rowWrapper.id = prospect.id;
      let nameDiv = document.createElement('div');
      nameDiv.textContent = prospect.playername;
      let draftDiv = document.createElement('div');
      draftDiv.innerHTML = "<button class='draft-button inactive-button' disabled>+</button>";

      let self = this;
      draftDiv.addEventListener('click', function ( event ) {
        self.makePick(prospect.id);
      });
      let positionDiv = document.createElement('div');
      positionDiv.textContent = prospect.position;
      rowWrapper.append(nameDiv, draftDiv, positionDiv);

      prospectBox.append(rowWrapper);
    });
  }

  runDraft() {
    let self = this;
    
    this.interval = setInterval(function() {
      self.doPick();
    }, 2000);
  }

  doPick() {
    this.draft_slot = this.getNextDraftSlot();

    if(this.round_turnovers.includes(this.draft_slot[0])) {
      this.current_round++;
    }

    if(this.draft_slot[1] == this.teamGM) {
      clearInterval(this.interval);
      this.allowUserPick();
    } else {
      this.makePick();
    }
    this.current_pick_num++;
  }

  allowUserPick() {
    this.sounds.user_pick_sound.play();
    let prospect_buttons = document.querySelectorAll('.draft-button');
    prospect_buttons.forEach(button => {
      button.disabled = false;
      button.classList.add("draft-button-active");
    });
    this.renderUserDraftCard();
  }

  disallowUserPick() {
    let prospect_buttons = document.querySelectorAll('.draft-button');
    prospect_buttons.forEach(button => {
      button.disabled = true;
      button.classList.remove("draft-button-active");
    });
    document.querySelector("#draft-card-message").style.display = 'hidden';
    document.querySelector("#draft-card-message").innerHTML = "";
  }

  renderUserDraftCard() {
    let draft_card = document.querySelector('#active-drafter-card-inner');
    draft_card.querySelector("#draft-card-message").style.display = 'block';
    draft_card.querySelector("#draft-card-message").innerHTML = "Your pick!";
    draft_card.querySelector("#draftee-name").innerHTML = '';
    draft_card.querySelector("#draftee-position").innerHTML = '';
    draft_card.querySelector("#draftee-school").innerHTML = '';
    draft_card.querySelector("#draft-round").innerHTML = this.current_round;
    draft_card.querySelector("#draft-overall").innerHTML = this.draft_slot[0];
    draft_card.querySelector("#drafting-team-logo").src=`/assets/NFL/${this.draft_slot[1]}.png`;
  }

  makePick(prospect_id = null) {
    let current_prospect = null;
    let draft_slot = this.draft_slot;
    if(prospect_id) {
      let current_prospect_index = this.prospects.findIndex(prospect => prospect.id === prospect_id);
      current_prospect = this.prospects[current_prospect_index];
      this.prospects.splice(current_prospect_index, 1);
    } else {
      current_prospect = this.getNextPick();
    }
    this.renderDraftCard(current_prospect);
    this.addToPickList(current_prospect);
    this.removefromProspects(current_prospect.id);
    if(prospect_id) {
      this.disallowUserPick();
      this.addToUserPickList(current_prospect);
      this.runDraft();
    }
  }

  removefromProspects(id) {
    document.getElementById(id).remove();
  }

  getNextPick() {
    let draft_slot = this.draft_slot;
    let currteam = this.capitalizeTeam(draft_slot[1]);
    let currteamneeds = this.teamneeds[currteam];
    let current_prospect = null;

    let primary = currteamneeds["Primary"].split(',');
    let secondary = currteamneeds["Secondary"];
    let tertiary = currteamneeds["Ancillary"];
    let noneed = currteamneeds["Noneed"];

    let wt_primary = 100/primary.length;
    let wt_rank = 526 - draft_slot[0];
    let wt_peak = 526;

    if(this.current_round == 1) {
      let next =  this.prospects[0];
      if(primary.indexOf(next.position) > -1) {
        current_prospect = this.prospects.shift();
      } else {
        let major_infl = primary[0];
        let current_prospect_index = this.prospects.findIndex(prospect => prospect.position == major_infl);
        current_prospect = this.prospects[current_prospect_index];
        this.prospects.splice(current_prospect_index, 1);
      }
    } else {
      // FOR NOW
      current_prospect = this.prospects.shift();
    }

    return current_prospect;

  }

  getNextDraftSlot() {
    return this.draftorder.shift();
  }

  renderDraftCard(player) {
    let slot = this.draft_slot;
    let draft_card = document.querySelector('#active-drafter-card-inner');
    let team = slot[1];

    draft_card.querySelector("#draftee-name").innerHTML = player.playername;
    draft_card.querySelector("#draftee-position").innerHTML = player.position;
    draft_card.querySelector("#draftee-school").innerHTML = player.school;
    draft_card.querySelector("#draft-round").innerHTML = this.current_round;
    draft_card.querySelector("#draft-overall").innerHTML = slot[0];
    draft_card.querySelector("#drafting-team-logo").src=`/assets/NFL/${team}.png`;
    draft_card.classList.add("active-drafter-card-do-flip");
  }

  addToPickList(player) {
    let pick_list_parent = document.querySelector("#drafted-list");
    let pick_html = "<div class='prospect-info-row tight-row'><div>" + this.draft_slot[0] + "</div><div>" + this.capitalizeTeam(this.draft_slot[1]) + "</div><div>" + player.playername + "</div></div>";
    pick_list_parent.innerHTML += pick_html;
  }

  addToUserPickList(player) {
    let slot = this.draft_slot;
    let pick_list_parent = document.querySelector("#team-draft-list");
    let pick_html = "<div class='prospect-info-row tight-row'><div>" + slot[0] + "</div><div>" + player.playername + "</div><div>" + player.position + "</div></div>";
    pick_list_parent.innerHTML += pick_html;
  }

  async getData(file) {
    const fullpath = './data/' + file;
    try {
        const response = await fetch(fullpath);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log(error);
    }
  }

  capitalizeTeam(team) {
    return team.charAt(0).toUpperCase() + team.slice(1);
  }
}
