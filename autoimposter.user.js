// ==UserScript==
// @name         Auto Imposter Bot
// @namespace    evaisa.nl
// @version      0.1
// @description  Plays r/imposter for you
// @author       mat,evaisa
// @match        https://gremlins-api.reddit.com/*
// @grant        none
// ==/UserScript==

document.getElementsByTagName("head")[0].insertAdjacentHTML(
    "beforeend",
    "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css\" />");

let imported = document.createElement('script');
imported.src = 'https://cdn.jsdelivr.net/npm/toastify-js';
document.head.appendChild(imported);

window.last = "INVALID";
window.wins = []; window.loses = [];
let timing = [];

async function checkAnswerOcean(element) {
    const text = element.textContent.trim()
    const r = await fetch('https://wave.ocean.rip/answers/answer?text=' + text)
    const resp = await r.json()
    element.isCorrect = true
    if (resp.status === 404) {
        element.style.opacity = 1
        element.isCorrect = true
        console.log("fuck")
        return true
    } else if (resp.answer.is_correct === false) {
        element.isCorrect = false
        element.style.opacity = .1
        return false
    }
    element.isCorrect = true
    element.style.opacity = 1
    return true
}

async function checkAnswersOcean(answerEls) {
    const promises = []
    for (const answerEl of answerEls) {
        promises.push(checkAnswerOcean(answerEl))
    }
    await Promise.all(promises)
    const correctAnswerEls = []
    for (const answerEl of answerEls)
        if (answerEl.isCorrect)
            correctAnswerEls.push(answerEl)
    return correctAnswerEls
}

async function checkAnswerSpacescience(element) {
    const id = element.id
    try {
        var r = await fetch('https://spacescience.tech/check.php?id=' + id)
    } catch(e) {
        return true
    }
    const resp = await r.json()
    console.log(resp)
    element.isCorrect = true
    if (resp.slow === 'yes') return true
    for (const item of Object.values(resp)) {
        if (item.flag) {
            if (item.result === 'LOSE') {
                element.style.opacity = .1
                element.isCorrect = false
                return false
            }
            /*else {
                element.isCorrect = true
                element.style.opacity = 1
                return false
            }*/
        }
    }
    return true
}


async function checkAnswersSpacescience(answerEls) {
    const promises = []
    for (const answerEl of answerEls) {
        promises.push(checkAnswerSpacescience(answerEl))
    }
    await Promise.all(promises)
    const correctAnswerEls = []
    for (const answerEl of answerEls)
        if (answerEl.isCorrect)
            correctAnswerEls.push(answerEl)
    return correctAnswerEls
}

async function checkAnswersSneknet(answerEls) {
    const r = await fetch('https://api.snakeroom.org/y20/query', {
        method: 'POST',
        body: JSON.stringify({
            options: answerEls.map(answer => answer.innerHTML.trim()),
        }),
    })
    const resp = await r.json()
    const possibleAnswers = answerEls
    for (const answer of resp.answers) {
        const answerEl = answerEls[answer.i]
        if (!answer.correct) {
            var index = possibleAnswers.indexOf(answerEl)
            answerEl.style.opacity = .1
            if (index !== -1) possibleAnswers.splice(index, 1);
        }
    }
    return possibleAnswers
}


async function checkAnswerAbraScore(element) {
    const text = element.textContent.trim()
    const r = await fetch('https://detector.abra.me/?' + text)
    const resp = await r.json()
    element.fake_probability = resp.fake_probability
    return resp.fake_probability
}

async function getTopAbra(answerEls) {
    const promises = []
    for (const answerEl of answerEls) {
        promises.push(checkAnswerAbraScore(answerEl))
    }
    var highestProbabilityEl
    var highestProbabilityScore = -1
    await Promise.all(promises)

    for (const answerEl of answerEls) {
        console.log(answerEl, answerEl.fake_probability)
        if (answerEl.fake_probability > highestProbabilityScore) {
            highestProbabilityEl = answerEl
            highestProbabilityScore = answerEl.fake_probability
            console.log('highestProbabilityEl', highestProbabilityEl)
        }
    }
    return highestProbabilityEl
}

async function checkAnswersAbra(answerEls) {
    const r = await fetch('https://librarian.abra.me/check', {
        method: 'POST',
        body: JSON.stringify({
            texts: answerEls.map(answer => answer.innerHTML.trim()),
        }),
        headers: {
            'content-type': 'application/json'
        }
    })
    const resp = await r.json()
    const possibleAnswers = []
    for (let i = 0; i < answerEls.length; i++) {
        if (resp.results[i] === 'unknown')
            possibleAnswers.push(possibleAnswers)
    }
    return possibleAnswers
}

async function skip() {
    const csrf = document.getElementsByTagName('gremlin-app')[0].getAttribute('csrf')
    const noteId = document.getElementsByTagName('gremlin-note')[0].id
    const params = new URLSearchParams({
        'undefined': 'undefined',
        'csrf_token': csrf,
        'note_ids': noteId
    });
    const body = params.toString()

    await fetch(
        'https://gremlins-api.reddit.com/report_note',
        {
            method: 'POST',
            body,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'accept': 'gremlin/html'
            }
        }
    )
    location.reload()

}

async function submitReport(element, doc) {
    if (typeof(element) != "undefined"){
        let our_body = "undefined=undefined&note_ids="+element.id+"&csrf_token="+doc.getElementsByTagName('gremlin-app')[0].getAttribute('csrf')
        let res = await (await fetch("https://gremlins-api.reddit.com/report_note", {
            method: "post",
            headers: {
                'accept': 'gremlin/html',
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: our_body
        })).text();
    }
   // console.log(JSON.parse(res))
    setTimeout(() => {window.open("https://gremlins-api.reddit.com/results?prev_result=WIN&nightmode=1","_self")}, 500)
    //window.open("https://gremlins-api.reddit.com/room?nightmode=1&platform=desktop","_self");
}


function addSkipButton() {
    const reportButtonEl = document.getElementsByTagName('gremlin-room')[0].shadowRoot.querySelector('gremlin-action')
    const skipButtonEl = document.createElement('gremlin-action')
    skipButtonEl.setAttribute('hollow', '')
    skipButtonEl.setAttribute('type', '')
    skipButtonEl.setAttribute('role', 'button')
    reportButtonEl.parentNode.insertBefore(skipButtonEl, reportButtonEl.nextSibling);
    skipButtonEl.textContent = 'Skip'

    skipButtonEl.addEventListener('click', skip)
}


async function submitAnswer(element, doc) {

    console.log(element.id)



    let our_body = "undefined=undefined&note_id="+element.id+"&csrf_token="+doc.getElementsByTagName('gremlin-app')[0].getAttribute('csrf')
    let res = await (await fetch("https://gremlins-api.reddit.com/submit_guess", {
        method: "post",
        headers: {
            'accept': 'gremlin/html',
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: our_body
    })).text();

    console.log(JSON.parse(res))


    let result = JSON.parse(res);


    console.log(result)

    let game = [element.innerText.trim(), result.result]



    game[0] = game[0].trim();
    if(game[1] === "WIN") wins.push(game[0]);
    else if(game[1] === "LOSE") loses.push(game[0]);

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

    play()



   // return JSON.parse(res);
}

async function getDocument(/*res, elements*/) {
    let res = await (await fetch("https://gremlins-api.reddit.com/room?nightmode=1&platform=desktop")).text();
    let parser = new DOMParser();
    let doc = parser.parseFromString(res, "text/html");

    return doc;
};

function getStats() {
    const sum = timing.reduce((a, b) => a + b, 0);
    const avg = (sum / timing.length) || 0;

//     console.log(wins);
    return `All: ${wins.length+loses.length} -
Wins: ${wins.length} (${((wins.length/(wins.length+loses.length))*100).toFixed(1)}%),
Loses: ${loses.length} (${((loses.length/(wins.length+loses.length))*100).toFixed(1)}%), Time (ms): ${avg}
`;
}

async function play() {
    'use strict';
/*
    if (window.location.pathname == '/results') {
        window.location.pathname = '/room'
        return
    }*/

    let doc = await getDocument();

    const answerEls = doc.getElementsByTagName('gremlin-note')

    var correctAnswerEls = await checkAnswersOcean(answerEls)

    if (correctAnswerEls.length === 1) {
        //correctAnswerEls[0].click()
        await submitAnswer(correctAnswerEls[0], doc);

    } else {
        if (correctAnswerEls.length == 0) correctAnswerEls = answerEls
        var correctAnswerEls2 = await checkAnswersSpacescience(correctAnswerEls)
        if (correctAnswerEls2.length === 1) {
            //correctAnswerEls2[0].click()
            await submitAnswer(correctAnswerEls2[0], doc);

        } else {
            await submitReport(correctAnswerEls[0], doc);
            // everything below has false positives

            if (correctAnswerEls2.length == 0) correctAnswerEls2 = correctAnswerEls
            var correctAnswerEls3 = await checkAnswersSneknet(correctAnswerEls2)
            if (correctAnswerEls3.length === 1) {
                //correctAnswerEls3[0].click()
                await submitAnswer(correctAnswerEls3[0], doc);

            } else {
                if (correctAnswerEls3.length == 0) correctAnswerEls3 = correctAnswerEls2
                var correctAnswerEls4 = await checkAnswersAbra(correctAnswerEls3)
                if (correctAnswerEls4.length === 1) {
                    //correctAnswerEls4[0].click()
                    await submitAnswer(correctAnswerEls4[0], doc);

                } else {
                    const topCorrectAnswer = await getTopAbra(correctAnswerEls3)
                    //topCorrectAnswer.style.borderColor = '#46D160'
                    //topCorrectAnswer.click()
                    await submitReport(correctAnswerEls[0], doc)
                }
            }
        }


    }
}
play();
/*
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
*/
