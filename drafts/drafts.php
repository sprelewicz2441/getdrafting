<?php
require_once "./Model/Prospect.php";

if($_GET['getplayers'] == 1) {
  $prospect_h = new Prospect();
  echo json_encode($prospect_h->getProspects());
}

?>