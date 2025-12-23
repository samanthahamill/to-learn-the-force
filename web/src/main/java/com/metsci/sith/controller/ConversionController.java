package com.metsci.sith.controller;

import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Objects;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.Getter;
import lombok.Setter;

@RestController
@CrossOrigin
@RequestMapping( "/api" )
public class ConversionController
{
    private static final Logger LOGGER = LoggerFactory.getLogger( ConversionController.class );

    Instant newFileTime = Instant.now( );

    @PutMapping( "/newStartDate" )
    public ResponseEntity<Void> setConversionOffsetMillis(
            @RequestBody
            String newStartDate )
    {
        LOGGER.debug( "Setting new start date: {}", newStartDate );
        if ( !newStartDate.endsWith( "Z" ) )
        {
            newStartDate = newStartDate + 'Z';
        }
        this.newFileTime = Instant.parse( newStartDate );
        LOGGER.info( "Setting new start date: {}", this.newFileTime );
        return ResponseEntity.ok( ).build( );
    }

    @PostMapping( "/convert" )
    public ResponseEntity<byte[]> convert(
            @RequestBody
            UploadRequest request )
    {
        try ( ByteArrayInputStream bais = new ByteArrayInputStream( Base64.getDecoder( ).decode( request.getData( ) ) );
              Reader reader = new InputStreamReader( bais, StandardCharsets.UTF_8 ) )
        {
            CSVFormat format = CSVFormat.DEFAULT.builder( )
                    .setHeader( ) // Assumes the first line is the header
                    .setSkipHeaderRecord( true ) // Skips the header record when iterating over data
                    .build( );

            try ( CSVParser csvParser = new CSVParser( reader, format ) )
            {
                List<CSVRecord> records = csvParser.getRecords( );

                if ( records.isEmpty( ) )
                {
                    throw new RuntimeException( "Provided CSV file was empty." );
                }

                int timestampColumnIndex = -1;
                List<String> headers = csvParser.getHeaderNames( );

                for ( int i = 0; i < headers.size( ); i++ )
                {
                    String header = headers.get( i );
                    if ( Objects.equals( header, "TIMESTAMP" ) )
                    {
                        timestampColumnIndex = i;
                        break;
                    }
                }

                if ( timestampColumnIndex == -1 )
                {
                    throw new RuntimeException( "No TIMESTAMP column was found in data. Nothing to modify." );
                }

                long timeOffsetMillis = 0;

                StringBuilder sb = new StringBuilder( );

                // Ensure headers are added to modified CSV
                sb.append( String.join( ",", headers ) ).append( "\n" );

                for ( CSVRecord record : records )
                {
                    String[] rawRecord = record.stream( ).toArray( String[]::new );

                    Instant instant = Instant.parse( rawRecord[timestampColumnIndex] );

                    if ( timeOffsetMillis == 0 )
                    {
                        timeOffsetMillis = instant.toEpochMilli( ) - this.newFileTime.toEpochMilli( );
                    }

                    rawRecord[timestampColumnIndex] = instant.plusMillis( timeOffsetMillis ).toString( );

                    sb.append( String.join( ",", rawRecord ) ).append( "\n" );
                }

                HttpHeaders httpHeader = new HttpHeaders( );
                httpHeader.setContentType( MediaType.valueOf( "text/csv" ) ); // Set Content-Type
                httpHeader.setContentDisposition(
                        ContentDisposition.builder( "attachment" ) // Prompts file download
                                .filename( "modified.csv" )
                                .build( ) );

                LOGGER.info( "File successfully converted" );

                return new ResponseEntity<>( sb.toString( ).getBytes( StandardCharsets.UTF_8 ), httpHeader, HttpStatus.OK );
            }
        }
        catch ( Exception e )
        {
            LOGGER.error( "Could not modify file", e );
            return ResponseEntity.badRequest( ).build( );
        }
    }

    @Setter
    @Getter
    public static class UploadRequest
    {
        // Getters and setters
        private String data;
    }

}
