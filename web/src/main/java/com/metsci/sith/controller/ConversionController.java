package com.metsci.sith.controller;

import java.io.ByteArrayInputStream;
import java.io.IOException;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;

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
            @RequestParam( "newStartDate" )
            String newStartDate )
    {
        LOGGER.debug( "Setting new start date: {}", newStartDate );
        this.newFileTime = Instant.parse( newStartDate );
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
                //                String[] headers = headerNames.getFirst( ).split( "\\t" );

                for ( int i = 0; i < headers.size( ); i++ )
                {
                    String header = headers.get( i );
                    System.out.println( header );
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

                sb.append( String.join( ",", headers ) ).append( "\n" );

                for ( CSVRecord record : records )
                {
                    String[] rawRecord = record.stream( ).toArray( String[]::new );

                    // need to skip first row
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

                // 4. Return the ResponseEntity
                return new ResponseEntity<>( sb.toString( ).getBytes( StandardCharsets.UTF_8 ), httpHeader, HttpStatus.OK );
            }
        }
        catch ( Exception e )
        {
            LOGGER.error( "Could not transform file", e );
            return ResponseEntity.badRequest( ).build( );
        }
    }

    public String modifyCsvFile( CSVReader csvReader ) throws IOException, CsvException
    {
        // 1. Read all data into a List of String arrays
        List<String[]> allData = csvReader.readAll( );

        System.out.println( "allData" );
        System.out.println( allData );
        if ( allData.isEmpty( ) )
        {
            throw new RuntimeException( "Provided CSV file was empty." );
        }

        int timestampColumnIndex = -1;
        String[] headerRow = allData.getFirst( );

        System.out.println( "headerRow" );
        System.out.println( headerRow );

        for ( int i = 0; i < headerRow.length; i++ )
        {
            String header = headerRow[i];
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

        StringBuilder sb = new StringBuilder( );
        long timeOffsetMillis = 0;

        // Modify the data (Example: Change Bob's age to 26)
        for ( int i = 0; i < allData.size( ); i++ )
        {
            String[] row = allData.get( i );

            if ( i != 0 )
            {
                // need to skip first row
                Instant instant = Instant.parse( row[timestampColumnIndex] );

                if ( timeOffsetMillis == 0 )
                {
                    timeOffsetMillis = instant.toEpochMilli( ) - this.newFileTime.toEpochMilli( );
                }

                row[timestampColumnIndex] = instant.plusMillis( timeOffsetMillis ).toString( );
            }
            else
            {
                System.out.println( "Row 0" );
                System.out.println( String.join( ",", row ) );
            }
            sb.append( String.join( ",", row ) );
        }

        return sb.toString( );
    }

    @Setter
    @Getter
    public static class UploadRequest
    {
        // Getters and setters
        private String data;
    }

    //    public ResponseEntity<byte[]> convertTimesInFile(
    //            @RequestParam( "file" )
    //            MultipartFile file )
    //    {
    //        // Here you can save the file to a directory, database, or cloud storage (e.g., AWS S3)
    //        // Example: saving the file name and size
    //        String fileName = file.getOriginalFilename( );
    //        long fileSize = file.getSize( );
    //        System.out.println( "Received file: " + fileName + " with size: " + fileSize + " bytes" );
    //
    //        try ( InputStream stream = file.getInputStream( ) )
    //        {
    //            CSVReader csvReader = new CSVReader( new InputStreamReader( stream ) );
    //
    //            byte[] csvBytes = modifyCsvFile( csvReader ).getBytes( StandardCharsets.UTF_8 );
    //
    //            HttpHeaders headers = new HttpHeaders( );
    //            headers.setContentType( MediaType.valueOf( "text/csv" ) ); // Set Content-Type
    //            headers.setContentDisposition(
    //                    ContentDisposition.builder( "attachment" ) // Prompts file download
    //                            .filename( "modified.csv" )
    //                            .build( ) );
    //
    //            // 4. Return the ResponseEntity
    //            return new ResponseEntity<>( csvBytes, headers, HttpStatus.OK );
    //        }
    //        catch ( Exception e )
    //        {
    //            LOGGER.error( "Could not transform file", e );
    //            return ResponseEntity.badRequest( ).build( );
    //        }
    //    }

}
