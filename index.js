const TelegramBot = require( 'node-telegram-bot-api' );
const $ = require('cheerio');
const presidentes = require('./presidentes.json');
const rp = require('request-promise');
const auth = require('./auth.json');
const request = require('request');
var fs = require('fs');
const quoteurl = "https://pt.wikiquote.org/wiki/";

const TOKEN = auth.token;



const bot = new TelegramBot( TOKEN, { polling: true } );

// Matches "/echo [whatever]"
bot.onText(/\/random/, (msg, match) => {
  console.log(msg);

  let rand = Math.floor(Math.random() * presidentes.name.length);
  let nome = presidentes.name[rand];

  let parseNome = nome.replace(/\s/g, "_");

  rp(quoteurl + parseNome)
  .then(function(html){
    let frases = [];
    let frase = $('.mw-parser-output', html);

    frase = frase[0];

    for(let i = 0; i < frase.children.length; i++){

      if(frase.children[i].attribs != undefined){
        let classe = frase.children[i].attribs.name;
        let tag = frase.children[i].name;

        if(classe == "noprint")
        break;
        if(tag == "h2"){
          let atributos = frase.children[i].children[0].attribs;

          if(atributos != undefined)
          if(atributos.id == "Sobre")
          break;
        }
      }

      if(frase.children[i].name == "ul"){
        let tmp = frase.children[i];

        if(tmp.children[0].name == "li"){
          let str = "";
          let tag_li = tmp.children[0];
          let tag_li_name = tag_li.name;
          let tag_li_type = tag_li.type;
          let tag_li_children_length = tag_li.children.length;

          for(let j = 0; j < tag_li_children_length; j++){
            let current_tag = tag_li.children[j];
            if(current_tag.children == undefined){
              let frase = current_tag.data;
              str = str.concat(frase);
            }
            else{
              let current_tag_children_length = current_tag.children.length;
              if(current_tag_children_length > 0)
              for(let k = 0; k < current_tag_children_length; k++){
                let frase = current_tag.children[k].data;
                str = str.concat(frase);
              }
            }
          }
          str = str.concat('\n-' + nome);
          frases.push(str);
          str = "";
        }
      }
    }

    //Randomiza a frase
    let randPhrase = Math.floor(Math.random() * frases.length);
    let message = frases[randPhrase];
    let chatId = msg.chat.id;

    //Busca foto aqui
    let photosrc = $('div > a > img', html).attr("src");


    let options = {
      url: "https:" + photosrc,
      method: "get",
      encoding: null
    };

    console.log('Requesting image of ' + parseNome + '..');
    request(options, function (error, response, body) {

      if (error) {
        console.error('error:', error);
      } else {
        console.log('Response: StatusCode:', response && response.statusCode);
        console.log('Response: Body: Length: %d. Is buffer: %s', body.length, (body instanceof Buffer));

        bot.sendPhoto(chatId, body, { caption: message }).then(function(){
          console.log('Send sucessfull!');
        }).catch((error) => {
          console.log(error.code);  // => 'ETELEGRAM'
        });

      }
    });
  });
});

bot.on('polling_error', (error) => {
  console.log('polling error');
  console.log(error.code);
});
