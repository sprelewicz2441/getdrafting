'use strict';
import Draft from './Draft.js';

let draft;

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
    //console.log("Team: " + teamGM);
  })
});

document.querySelector("#start-draft-button").addEventListener('click', (event) => {
  draft.startDraft(teamGM);
});

document.querySelector("#all-picks-tab").addEventListener('click', (event) => {
  document.querySelector("#drafted-list").style.display = 'block';
  document.querySelector("#team-draft-list").style.display = 'none';
  document.querySelector("#available-prospect-list").style.display = 'none';
});

document.querySelector("#your-picks-tab").addEventListener('click', (event) => {
  document.querySelector("#drafted-list").style.display = 'none';
  document.querySelector("#team-draft-list").style.display = 'block';
  document.querySelector("#available-prospect-list").style.display = 'none';
});

document.querySelector("#available-prospects-tab").addEventListener('click', (event) => {
  document.querySelector("#drafted-list").style.display = 'none';
  document.querySelector("#team-draft-list").style.display = 'none';
  document.querySelector("#available-prospect-list").style.display = 'block';
});
