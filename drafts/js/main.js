'use strict';
import Draft from './Draft.js';

let draft = null;

window.addEventListener('DOMContentLoaded', (event) => {
  fetch('/drafts/drafts.php?getplayers=1')
    .then(response => response.json())
    .then(prospects => {
        draft = new Draft(prospects);
        draft.init();
    })
    .catch(error => {
        // handle the error
    });
});

let teamGM = '';
document.querySelectorAll(".team-GM-select").forEach(el => {
  el.addEventListener('click', function (e) {
    teamGM = this.closest('button').id;
    document.querySelector("#start-screen-message").innerHTML = "You will be drafting as the " + draft.capitalizeTeam(teamGM);
  })
});

document.querySelector("#start-draft-button").addEventListener('click', (event) => {
  draft.startDraft(teamGM);
  document.querySelector("#available-prospects-tab").click();
});

document.querySelector("#skip-cutscene").addEventListener('click', (event) => {
  draft.stopMusic();
  draft.letsGetThisPartyStarted();
});

document.querySelector("#all-picks-tab").addEventListener('click', (event) => {
  document.querySelector("#drafted-list").style.display = 'block';
  document.querySelector("#team-draft-list").style.display = 'none';
  document.querySelector("#available-prospect-list").style.display = 'none';
  document.querySelector("#your-picks-tab").classList.remove("focused-tab");
  document.querySelector("#available-prospects-tab").classList.remove("focused-tab");
  document.querySelector("#all-picks-tab").classList.add("focused-tab");
});

document.querySelector("#your-picks-tab").addEventListener('click', (event) => {
  document.querySelector("#drafted-list").style.display = 'none';
  document.querySelector("#team-draft-list").style.display = 'block';
  document.querySelector("#available-prospect-list").style.display = 'none';
  document.querySelector("#all-picks-tab").classList.remove("focused-tab");
  document.querySelector("#available-prospects-tab").classList.remove("focused-tab");
  document.querySelector("#your-picks-tab").classList.add("focused-tab");
});

document.querySelector("#available-prospects-tab").addEventListener('click', (event) => {

  document.querySelector("#drafted-list").style.display = 'none';
  document.querySelector("#team-draft-list").style.display = 'none';
  document.querySelector("#available-prospect-list").style.display = 'block';
  document.querySelector("#all-picks-tab").classList.remove("focused-tab");
  document.querySelector("#your-picks-tab").classList.remove("focused-tab");
  document.querySelector("#available-prospects-tab").classList.add("focused-tab");
});

document.querySelector("#pause-draft-button").addEventListener('click', (event) => {
  event.target.style.display = "none";
  document.querySelector("#resume-draft-button").style.display = "block";
  draft.pauseDraft();
});

document.querySelector("#resume-draft-button").addEventListener('click', (event) => {
  event.target.style.display = "none";
  document.querySelector("#pause-draft-button").style.display = "block";
  draft.runDraft();
});
