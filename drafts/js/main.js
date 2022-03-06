'use strict';
import Draft from './Draft.js';

let draft;
window.addEventListener('DOMContentLoaded', (event) => {
  fetch('/drafts/drafts.php?getplayers=1')
    .then(response => response.json())
    .then(prospects => {
        draft = new Draft(prospects);
    })
    .catch(error => {
        // handle the error
    });
});

let teamGM = '';
document.querySelectorAll(".team-GM-select").forEach(el => {
  el.addEventListener('click', function (e) {
    teamGM = this.closest('button').id;
    //console.log("Team: " + teamGM);
  })
});

document.querySelector("#start-draft-button").addEventListener('click', (event) => {
  draft.startDraft(teamGM);
});
