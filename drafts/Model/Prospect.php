<?php
require_once "./Model/Database.php";
 
class Prospect extends Database
{
    public function getProspects()
    {
        return $this->select("SELECT * FROM prospects ORDER BY peak, rank", []);
    }
}