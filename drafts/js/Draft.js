export default class Draft {
  constructor(prospects) {
    this.prospects = prospects;
    this.current_pick_num = 1;
    this.current_round = 1;
    this.teamGM = '';
  }

  init() {
    this.getData('draftmetadata2022.json').then(val => {
      this.metadata = val;
    });
    this.getData('draftorder2022.json').then(val => {
      this.draftorder = val;
    });
  }

  startDraft(teamGM) {
    if(teamGM === '') {
      console.log("No team selected");
      return;
    }

    this.teamGM = teamGM;
    this.hideTeamSelect();
    this.showMainDraftScreen();
    this.populateAvailableProspects();
    document.querySelector('#draft-dialog').innerHTML = "You are drafting as the " + this.teamGM;
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
    console.log(this.prospects[0]);
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
        self.makePick(null, prospect.id);
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
    let draft_slot = this.getNextDraftSlot();
    if(draft_slot[1] == this.teamGM) {
      clearInterval(this.interval);
      this.draft_slot = draft_slot;
      this.allowUserPick();
    } else {
      this.makePick(draft_slot);
    }
    this.current_pick_num++;
  }

  allowUserPick() {
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
    draft_card.querySelector("#draft-card-message").innerHTML = "You're pick!";
    draft_card.querySelector("#draftee-name").innerHTML = '';
    draft_card.querySelector("#draftee-position").innerHTML = '';
    draft_card.querySelector("#draftee-school").innerHTML = '';
    draft_card.querySelector("#draft-round").innerHTML = this.current_round;
    draft_card.querySelector("#draft-overall").innerHTML = this.draft_slot[0];
    draft_card.querySelector("#drafting-team-logo").src=`/assets/NFL/${this.draft_slot[1]}.png`;
  }

  makePick(draft_slot = null, prospect_id = null) {
    let current_prospect = null;
    if(prospect_id) {
      draft_slot = this.draft_slot;
      let current_prospect_index = this.prospects.findIndex(prospect => prospect.id === prospect_id);
      current_prospect = this.prospects[current_prospect_index];
      this.prospects.splice(current_prospect_index, 1);
    } else {
      current_prospect = this.getNextPick();
    }
    this.renderDraftCard(current_prospect, draft_slot);
    this.addToPickList(current_prospect, draft_slot);
    this.removefromProspects(current_prospect.id);
    if(prospect_id) {
      this.disallowUserPick();
      this.addToUserPickList(current_prospect, draft_slot);
      this.runDraft();
    }
  }

  removefromProspects(id) {
    document.getElementById(id).remove();
  }

  getNextPick() {
    return this.prospects.shift();
  }

  getNextDraftSlot() {
    return this.draftorder.shift();
  }

  renderDraftCard(player, slot) {
    let draft_card = document.querySelector('#active-drafter-card-inner');
    let team = slot[1];

    draft_card.querySelector("#draftee-name").innerHTML = player.playername;
    draft_card.querySelector("#draftee-position").innerHTML = player.position;
    draft_card.querySelector("#draftee-school").innerHTML = player.school;
    draft_card.querySelector("#draft-round").innerHTML = this.current_round;
    draft_card.querySelector("#draft-overall").innerHTML = slot[0];
    draft_card.querySelector("#drafting-team-logo").src=`/assets/NFL/${team}.png`;
    //draft_card.classList.add("active-drafter-card-do-flip");
  }

  addToPickList(player, slot) {
    let pick_list_parent = document.querySelector("#drafted-list");
    let pick_html = "<div class='prospect-info-row'><div>" + slot[0] + "</div><div>" + slot[1] + "</div><div>" + player.playername + "</div></div>";
    pick_list_parent.innerHTML += pick_html;
  }

  addToUserPickList(player, slot) {
    let pick_list_parent = document.querySelector("#team-draft-list");
    let pick_html = "<div class='prospect-info-row'><div>" + slot[0] + "</div><div>" + player.playername + "</div><div>" + player.position + "</div></div>";
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
}
