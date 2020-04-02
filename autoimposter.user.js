// ==UserScript==
// @name         Imposter Bot
// @namespace    jrwr.io
// @version      1.1.?
// @description  Imposter bot that compares answers to databases to find the right answer and automatically plays the game.
// @author       dimden (https://dimden.dev/), jrwr (http://jrwr.io/), px, qqii, evaisa
// @match        https://gremlins-api.reddit.com/room?nightmode=1&platform=desktop
// @match        https://gremlins-api.reddit.com/room?nightmode=1&platform=desktop*
// @match        https://gremlins-api.reddit.com/results?*
// ==/UserScript==

document.getElementsByTagName("head")[0].insertAdjacentHTML(
    "beforeend",
    "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css\" />");

let imported = document.createElement('script');
imported.src = 'https://cdn.jsdelivr.net/npm/toastify-js';
document.head.appendChild(imported);


//const DETECTOR_URL = "https://detector.abra.me/?";
//const ABRA_URL = "https://librarian.abra.me/check";
const SPACESCIENCE_URL = "https://spacescience.tech/check.php?id=";
const OCEAN_URL = "https://wave.ocean.rip/answers/answer?text=";

async function checkExistingAbra(msgs) {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    let raw = JSON.stringify({"texts": msgs});

    let requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    let json = await fetch(ABRA_URL, requestOptions)
                         .then(response => response.json());
    return json.results;
}

async function checkExistingSpacescience(id) {
    let requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    let json = await fetch(SPACESCIENCE_URL+id, requestOptions)
                         .then(response => response.json());

    console.log(json);

    for (let key in json) {
        if (json[key].hasOwnProperty("flag")) {
            if (json[key].flag = 1) {
                console.log(json[key]);
                switch(json[key].result) {
                    /*case "WIN":
                        return "known fake";
                        Known bot data is completely unrealiable.
                    */
                    case "LOSE":
                        return "known human";
                }
            }
        }
    }
    return "unknown";
}

async function checkExistingOcean(msg) {
    let requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    let url = encodeURI(OCEAN_URL+(msg.trim()))

    console.log(url)

    let json = await fetch(url, requestOptions)
                         .then(response => response.json());



    if (json.status=200) {

        if(json.message != "not found in database"){
            console.log(json);
            if (json.answer.is_correct) {
                return "known fake";
            } else {
                return "known human";
            }
        }
    }

    return "unknown";
}

async function getRoom() {
    let res = await (await fetch("https://gremlins-api.reddit.com/room?nightmode=1&platform=desktop")).text();
    let parser = new DOMParser();
    let doc = parser.parseFromString(res, "text/html");

    return {
        token: doc.getElementsByTagName("gremlin-app")[0].getAttribute("csrf"),
        options: Array.from(doc.getElementsByTagName("gremlin-note")).map(e => [e.id, e.innerText])
    };
};



async function submitAnswer(token, id) {
    let body = new FormData();
    body.append("undefined", "undefined");
    body.append("note_id", id);
    body.append("csrf_token", token);
    let res = await (await fetch("https://gremlins-api.reddit.com/submit_guess", {
        method: "post",
        body
    })).text();

    return JSON.parse(res);
}
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}


async function play() {
    let room = await getRoom();
    let answer = 0,
        maxDetector = 0;

   // let abraP = checkExistingAbra(room.options.flatMap(x => x[0]));
    let spacP = Promise.all(room.options.flatMap(x => checkExistingSpacescience(x[0])));
    let oceaP = Promise.all(room.options.flatMap(x => checkExistingOcean(x[1])));
  //  let detecP = Promise.all(room.options.flatMap(x => checkDetector(x[1])));
    // cost of accuracy

    let [space, ocean] = await Promise.all([spacP, oceaP]);

    // console.table(abra);
    // console.table(space);
    // console.table(detector);

     let flag = 0;

    for (let i = 0; i < room.options.length; i++) {
        // o is id
        // z is string
        let [o, z] = room.options[i];
        if ( space[i] === "known fake" || ocean[i] == "known fake") {
            answer = i;
            break;
        } else if ( space[i] === "known human" || ocean[i] == "known human") {
            flag++;
            continue;
        } else if ( space[i] === "unknown" || ocean[i] == "unknown") {
             answer = i;
             /*if (detector[i] > maxDetector) {
                 maxDetector = detector[i];
                 answer = i;
                 continue;
             }*/
        }
    };

    // stuff for abusing report button, gets rate limited.


        let result = await submitAnswer(room.token, room.options[answer][0]);

        return [room.options[answer][1], result.result, room];

};

async function submitAnswerToDB(answer, result, room) {
    let body = new FormData();
    delete room.token;
    body.append("answer", answer);
    body.append("result", result);
    body.append("room", JSON.stringify(room));
    let res = await (await fetch("https://spacescience.tech/api.php", {
        method: "post",
        body
    })).text();

    return JSON.parse(res);
}

let timing = [];

function getStats() {
    const sum = timing.reduce((a, b) => a + b, 0);
    const avg = (sum / timing.length) || 0;

//     console.log(wins);
    return `All: ${wins.length+loses.length} -
Wins: ${wins.length} (${((wins.length/(wins.length+loses.length))*100).toFixed(1)}%),
Loses: ${loses.length} (${((loses.length/(wins.length+loses.length))*100).toFixed(1)}%), Time (ms): ${avg}
`;
}

window.last = "INVALID";
window.wins = []; window.loses = [];
setInterval(async () => {
    let t0 = performance.now();
    let game = await play();
    submitAnswerToDB(game[0].trim(), game[1], game[2]).then(
        function (submit) {
            let t1 = performance.now();
            timing.push(t1 - t0);
            game[0] = game[0].trim();
            if(game[1] === "WIN") wins.push(game[0]);
            else if(game[1] === "LOSE") loses.push(game[0]);
            last = game[1];
            if(game[1] === "WIN"){
                Toastify({
                    text: game[1] + ": "+ game[0],
                    duration: 5000,
                    newWindow: true,
                    close: true,
                    gravity: "top", // `top` or `bottom`
                    position: 'left', // `left`, `center` or `right`
                    backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
                    stopOnFocus: false, // Prevents dismissing of toast on hover
                }).showToast();
            }
            else if(game[1] === "LOSE"){
                Toastify({
                    text: game[1] + ": "+ game[0],
                    duration: 5000,
                    newWindow: true,
                    close: true,
                    gravity: "top", // `top` or `bottom`
                    position: 'left', // `left`, `center` or `right`
                    backgroundColor: "linear-gradient(to right, #e3392d, #6b110b)",
                    stopOnFocus: false, // Prevents dismissing of toast on hover
                }).showToast();
            }
        }
    )
}, 1200)

setInterval(() => {
    let curstatus = getStats();
Toastify({
  text: curstatus,
  duration: 10000,
  newWindow: true,
  close: false,
  gravity: "bottom", // `top` or `bottom`
  position: 'right', // `left`, `center` or `right`
  backgroundColor: "linear-gradient(to right, #8b59ba, #a989c7)",
  stopOnFocus: false, // Prevents dismissing of toast on hover
}).showToast();

    if(location.href.includes("results?") && !document.hidden) fetch(`https://gremlins-api.reddit.com/results?prev_result=${last}&nightmode=1&platform=desktop`).then(i => i.text()).then(html => {
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, "text/html");
        document.getElementsByTagName("gremlin-app")[0].innerHTML = doc.getElementsByTagName("gremlin-app")[0].innerHTML;
    })
}, 10000);
