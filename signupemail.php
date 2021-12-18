<?php

if(!empty($_POST['email'])) {
  $email = $_POST['email'];
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "Invalid email format";
    return 0;
  }

  $url = parse_url(getenv("CLEARDB_DATABASE_URL"));
  $server = $url["host"];
  $username = $url["user"];
  $password = $url["pass"];
  $db = substr($url["path"], 1);
  mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

  $conn = new mysqli($server, $username, $password, $db);
  $insert_sql = $conn->init();
  $insert_sql = $conn->prepare("INSERT INTO email_signups SET email = ?");
  $insert_sql->bind_param('s', $email);

  try {
    $insert_sql->execute();
  } catch (mysqli_sql_exception $e) {
    if($insert_sql->errno == 1062) {
      echo $e;
      echo "Duplicate";
      exit();
    }
  }
    
  echo "Success";
}

?>