var Crawler = require("crawler");
const fs = require('fs');
require('log-timestamp');

const srtDir = 'srt';
var showUrl = '';
var showUrls = [];
var baseUrl = 'https://www.addic7ed.com';
var cookie = '';

var crawler = new Crawler({
    maxConnections : 10,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0",
    timeout: 30000,
    /*rateLimit: 3000,*/
    // This will be called for each crawled page
    callback: processShows
});

function processSrt(error, res, done) {
  if(error){
    console.log(error);
  }else{
    //console.log(res.headers);
    if(res.headers['content-disposition']) {
      let cd = res.headers['content-disposition'];
      if(cd.indexOf('filename=') != - 1) {
        let filename = cd.substring(cd.indexOf('filename=') + 'filename='.length);
        filename = filename.replace(/\"/g, "");
        filename = filename.replace(/\ /g, "_");
        if (!fs.existsSync(srtDir)){
          fs.mkdirSync(srtDir);
        }
        let path = srtDir + '/' + filename;
        console.log('crawler queue len: ' + crawler.queueSize + ', saving: ' + path);
        fs.writeFileSync(path, res.body);
      }
    }
  }
  done();
}

function processShow(error, res, done) {
  if(error){
    console.log(error);
  }else{
    let $ = res.$;
    let showid = '';
    $('input').each((idx, elem) => {
      if ($(elem).attr('name') == 'showID')
        showid = $(elem).attr('value');
    });
    let seasons = $("#sl button");
    //console.log("seasons length:");
    //console.log(seasons.length);
    if (seasons.length > 1) {
      for(let i = 0; i < seasons.length; i++) {
        let s = seasons[i];
        let season = $(s).attr('s');
        if (+season != seasons.length) {
          let surl = baseUrl + '/ajax_loadShow.php?bot=1&show=' + showid + '&season=' + season + '&langs=|1|&hd=0&hi=0'
          crawler.queue([{
            uri: surl,
            /*headers: {
              Cookie: cookie
            },*/
            callback: processShow,
            priority: 4
          }]);
        }
      }
    } else if (seasons.length == 0) {
      $("tr .epeven.completed").each((idx, elem) => {
        let ihtml = $(elem).html();
        if(ihtml.indexOf('<td>English</td>') != -1) {
          let referer = showUrl;
          /*queue download*/
          $(elem).children().each((idx, elem) => {
            if($(elem).text() == 'Download') {
              let dl = $(elem).children()[0];
              let url1 = baseUrl + dl.attribs.href;
              //console.log("queueing: " + url1);
              crawler.queue([{
                uri: url1,
                priority: 3,
                referer: referer,
                jQuery: false,
                /*headers: {
                  Cookie: cookie
                },*/
                callback: processSrt
              }]);
            }

          });
          //console.log(ihtml);
        }
      });
    }
  }
  done();
}

function processShows(error, res, done) {
    if(error){
        console.log(error);
    }else{
        let $ = res.$;
        console.log('headers:');
        console.log(res.headers);
        if(res.headers['set-cookie']) {
          let cookiestr = res.headers['set-cookie'][0];
          cookie = cookiestr.substring(0, cookiestr.indexOf(';'));
          console.log("cookie: " + cookie);
        }
        // $ is Cheerio by default
        //a lean implementation of core jQuery designed specifically for the server
        $(".version a").each(function(idx) {
          showUrl = baseUrl + $(this).attr('href');
          //console.log(url);
          showUrls.push(showUrl);
          /* queue the urls for each show */
          crawler.queue([{
            uri: showUrl,
            /*headers: {
              Cookie: cookie
            },*/
            callback: processShow
          }]);
          //return false;
        });
    }
    done();
}

function start() {
  var urls = ['https://www.addic7ed.com/shows.php'];
  console.log('queueing urls:');
  console.log(urls);
  crawler.queue(urls);
}

module.exports = {
  start,
}
