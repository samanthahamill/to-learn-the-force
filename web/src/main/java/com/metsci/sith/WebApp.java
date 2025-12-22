package com.metsci.sith;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WebApp
{
    private static final Logger LOGGER = LoggerFactory.getLogger( WebApp.class );

    public static void main( String[] args )
    {
        LOGGER.info( """
                \n
                =======================================================
                Starting SITH
                =======================================================
                """ );

        SpringApplication.run( WebApp.class, args );
    }
}