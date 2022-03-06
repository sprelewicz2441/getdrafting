export default class Draft {

  constructor(prospects) {
    this.prospects = prospects;
    this.current_pick_num = 1;
    this.current_round = 1;
    this.teamGM = '';
  }

  startDraft(teamGM) {
    if(teamGM === '') {
      console.log("No team selected");
      return;
    }

    this.teamGM = teamGM;
    this.hideTeamSelect();
    this.showMainDraftScreen();
    document.querySelector('#draft-dialog').innerHTML = "You are drafting as the " + this.teamGM;
    let inner_class = this;
    this.interval = setInterval(function() {
      let current_pospect = inner_class.getNextPick();
      inner_class.renderDraftCard(current_pospect);
    }, 5000);
  }

  hideTeamSelect() {
    document.querySelector('#start-screen').style.display = 'none';
  }

  showMainDraftScreen() {
    document.querySelector('#main-draft-screen').style.display = 'block';
  }

  getNextPick() {
    return this.prospects.shift();
  }

  renderDraftCard(player) {
    let draft_card = document.querySelector('#active-drafter-card');
    draft_card.querySelector("#draftee-name").innerHTML = player.playername;
    draft_card.querySelector("#draftee-position").innerHTML = player.position;
    draft_card.querySelector("#draftee-school").innerHTML = player.school;
    draft_card.querySelector("#draft-round").innerHTML = this.current_round;
    draft_card.querySelector("#draft-overall").innerHTML = this.current_pick_num;
    draft_card.classList.add("active-drafter-card-do-flip");
    this.current_pick_num++;
  }
}
