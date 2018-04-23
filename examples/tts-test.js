const textToSpeech = require('@google-cloud/text-to-speech');
var fs = require('fs');
var player = require('play-sound')(opts = {})

var client = new textToSpeech.v1beta1.TextToSpeechClient({
    // optional auth parameters.
});

var input = { text: "Warning! Temperature threshold was exceeded by 14 degrees celsius!"};
var voice = {
    languageCode: "en-US",
    name: "en-US-Wavenet-C"
};
var audioConfig = {
    "audioEncoding": "MP3",
    "pitch": 0.00,
    "speakingRate": 1.00
};
var request = {
    input: input,
    voice: voice,
    audioConfig: audioConfig,
};
client.synthesizeSpeech(request)
    .then(responses => {
        var response = responses[0];


        fs.writeFile("output.mp3", response.audioContent, function (err) {
            if (err) {
                return console.log(err);
            }

            console.log("The file was saved!");

            // $ mplayer foo.mp3 
            player.play('output.mp3',{ mplayer: ['-ao', 'sdl' ] }, function (err) {
                if (err) throw err
            })
        });

    })
    .catch(err => {
        console.error(err);
    });

function handleEnd() {
    console.log("File ended!");
}