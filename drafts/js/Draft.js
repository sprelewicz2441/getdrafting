export default class Draft {
  constructor(prospects) {
    this.prospects = prospects;
    this.current_pick_num = 1;
    this.current_round = 1;
    this.teamGM = '';
    this.autopickTime = 500;

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

    this.sounds.end_sound = document.createElement("audio");
    this.sounds.end_sound.src = '/assets/draft-end.mp3';
    this.sounds.end_sound.setAttribute("preload", "auto");
    this.sounds.end_sound.setAttribute("controls", "none");
    this.sounds.end_sound.style.display = "none";
    document.body.appendChild(this.sounds.end_sound);
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

    let seconds = document.getElementById("countdown").textContent;
    let countdown = setInterval(function() {
        seconds--;
        document.getElementById("countdown").textContent = seconds;
        if (seconds <= 0) clearInterval(countdown);
    }, 1000);

    this.splashInterval = setTimeout(function() { 
      self.letsGetThisPartyStarted();
    }, 15000);
    
  }

  hideSplash() {
    if(this.splashInterval) {
      clearInterval(this.splashInterval);
    }
    document.querySelector('#draft-splash-screen').style.display = 'none';
  }

  startDraft(teamGM) {
    if(teamGM === '') {
      document.querySelector("#start-screen-message").innerHTML = "Please select a team to draft for.";
      return;
    }

    this.teamGM = teamGM;
    this.populateAvailableProspects();
    this.showSplash();
    document.querySelector('#draft-dialog').innerHTML = "You are drafting as the <strong>" + this.capitalizeTeam(this.teamGM) + "</strong>";
    
  }

  letsGetThisPartyStarted() {
    this.hideSplash();
    this.showMainDraftScreen();
    this.runDraft();
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
      rowWrapper.classList.add("loose-row");
      rowWrapper.id = prospect.id;
      let nameDiv = document.createElement('div');
      nameDiv.textContent = prospect.playername;
      let schoolDiv = document.createElement('div');
      schoolDiv.textContent = prospect.school;
      let draftDiv = document.createElement('div');
      draftDiv.innerHTML = "<button class='draft-button inactive-button' disabled>+</button>";

      let self = this;
      draftDiv.addEventListener('click', function ( event ) {
        self.makePick(prospect.id);
      });
      let positionDiv = document.createElement('div');
      positionDiv.textContent = prospect.position;
      rowWrapper.append(nameDiv, schoolDiv, draftDiv, positionDiv);

      prospectBox.append(rowWrapper);
    });
  }

  runDraft() {
    let self = this;
    
    this.interval = setInterval(function() {
      self.doPick();
    }, this.autopickTime);
  }

  pauseDraft() {
    clearInterval(this.interval);
  }

  doPick() {
    this.draft_slot = this.getNextDraftSlot();

    if(!this.draft_slot) {
      this.endDraft();
      return;
    }

    if(this.round_turnovers.includes(this.draft_slot[0])) {
      this.current_round++;
      this.addRoundBreak();
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
    document.querySelector("#pause-buttons").style.display = 'none';
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
    document.querySelector("#pause-buttons").style.display = 'block';
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
    let secondary = currteamneeds["Secondary"].split(',');;
    let tertiary = currteamneeds["Ancillary"].split(',');;
    let noneed = currteamneeds["Noneed"].split(',');;

    const wt_primary = 100/primary.length;
    const wt_rank = 526 - draft_slot[0];
    const wt_peak = 126;
    const wt_random = 5;

    if(this.current_round == 2) {
      let random_prim = Math.floor(Math.random() * secondary.length);
      let current_prospect_index = this.prospects.findIndex(prospect => prospect.position == secondary[random_prim].trim());
      current_prospect = this.prospects[current_prospect_index];
      this.prospects.splice(current_prospect_index, 1);
    } else if(this.current_round == 3) {
      let random_prim = Math.floor(Math.random() * tertiary.length);
      let current_prospect_index = this.prospects.findIndex(prospect => prospect.position == tertiary[random_prim].trim());
      current_prospect = this.prospects[current_prospect_index];
      this.prospects.splice(current_prospect_index, 1);
    } else if(this.current_round == 4) {
      let random_prim = Math.floor(Math.random() * secondary.length);
      let current_prospect_index = this.prospects.findIndex(prospect => prospect.position == secondary[random_prim].trim());
      current_prospect = this.prospects[current_prospect_index];
      this .prospects.splice(current_prospect_index, 1);
    } else if(this.current_round == 5) {
      let random_prim = Math.floor(Math.random() * tertiary.length);
      let current_prospect_index = this.prospects.findIndex(prospect => prospect.position == tertiary[random_prim].trim());
      current_prospect = this.prospects[current_prospect_index];
      this.prospects.splice(current_prospect_index, 1);
    } else if(this.current_round == 6) {
      let random_prim = Math.floor(Math.random() * secondary.length);
      let current_prospect_index = this.prospects.findIndex(prospect => prospect.position == secondary[random_prim].trim());
      current_prospect = this.prospects[current_prospect_index];
      this.prospects.splice(current_prospect_index, 1);
    } else if(this.current_round == 7) {
      let random_prim = Math.floor(Math.random() * tertiary.length);
      let current_prospect_index = this.prospects.findIndex(prospect => prospect.position == tertiary[random_prim].trim());
      current_prospect = this.prospects[current_prospect_index];
      this.prospects.splice(current_prospect_index, 1);
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
    let pick_html = "<div class='prospect-info-row tight-row'><div>" + this.current_round + "</div><div>" + this.draft_slot[0] + "</div><div>" + this.capitalizeTeam(this.draft_slot[1]) + "</div><div>" + player.playername + "</div><div>" + player.position + "</div>";
    pick_list_parent.innerHTML += pick_html;
  }

  addRoundBreak() {
    let pick_list_parent = document.querySelector("#drafted-list");
    pick_list_parent.innerHTML += "<hr />";
  }

  addToUserPickList(player) {
    let slot = this.draft_slot;
    let pick_list_parent = document.querySelector("#team-draft-list");
    let pick_html = "<div class='prospect-info-row tight-row'><div>" + this.current_round + "</div><div>" + slot[0] + "</div><div>" + player.playername + "</div><div>" + player.school + "</div><div>" + player.position + "</div></div>";
    pick_list_parent.innerHTML += pick_html;
  }

  endDraft() {
    clearInterval(this.interval);
    this.sounds.end_sound.play();
    document.querySelector("#active-drafter-card").style.display = 'none';
    document.querySelector("#draft-actions").style.display = 'none';
    document.querySelector("#available-prospect-list").style.display = 'none';
    document.querySelector("#available-prospects-tab").style.display = 'none';
    document.querySelector("#your-picks-tab").click();
    document.querySelector("#draft-dialog").innerHTML += "<p>Here are your draft results.</p>";
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

  stopMusic() {
    this.sounds.start_sound.pause();
  }
}
