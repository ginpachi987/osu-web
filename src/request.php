<?php

  // header_remove();
  // header('Access-Control-Allow-Origin: *');
  // http_response_code(200);

  // header('Content-type: application/json');
  // header('Status: 200 OK');

  $ls = scandir('beatmaps');
  $ls = array_slice($ls, 2);

  $res = [];

  foreach ($ls as $folder) { 
    $beatmaps = scandir('beatmaps/' . $folder);
    $beatmap = [
      'folder' => $folder,
      'beatmaps' => []
    ];
    foreach ($beatmaps as $file) {
      if (strpos($file, '.osu') !== false) {
        $beatmap['beatmaps'][] = $file;
      }
    }
    array_push($res, $beatmap);
  }

  echo (json_encode($res));

?>