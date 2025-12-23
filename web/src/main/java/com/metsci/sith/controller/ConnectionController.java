package com.metsci.sith.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin
@RequestMapping( "/api" )
public class ConnectionController
{

    @GetMapping( "/checkConnection" )
    public ResponseEntity<Boolean> convertTimesInFile( )
    {
        return ResponseEntity.ok( true );
    }
}
