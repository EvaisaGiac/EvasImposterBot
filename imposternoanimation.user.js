// ==UserScript==
// @name         Imposter animation remover
// @namespace    evaisa
// @version      1.0.0
// @description  Removes animations from imposter.
// @author       evaisa
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

window.last = "INVALID";
window.wins = []; window.loses = [];

let elements = document.getElementsByTagName("gremlin-note");
for( var i=0,il = elements.length; i< il; i ++ ){

    console.log(elements[i])

    document.addEventListener('click', async (e) => {
        let our_element = e.target || e.srcElement;

        if(our_element != null){
            e.stopPropagation();
            console.log('gotcha');
            let room = await getRoom();



            console.log(our_element)

            console.log(room.token)

            console.log(our_element.getAttribute("id"))

            let result = await submitAnswer(room.token, our_element.getAttribute("id"));


            console.log(result)

            let game = [((our_element.getAttribute("aria-label")).substring(19)).trim(), result.result, room]



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



            setTimeout(() => { window.open("https://gremlins-api.reddit.com/room?nightmode=1&platform=desktop","_self");}, 600)
        }
    }, true);

}

async function getRoom() {
    return {
        token: document.getElementsByTagName("gremlin-app")[0].getAttribute("csrf"),
        options: Array.from(document.getElementsByTagName("gremlin-note")).map(e => [e.id, e.innerText])
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