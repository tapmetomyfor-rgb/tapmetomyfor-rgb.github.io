// ดาวตก

function createMeteor(){

    const meteor = document.createElement("div");

    meteor.classList.add("meteor");

    meteor.style.left =
    Math.random() * window.innerWidth + "px";

    meteor.style.top =
    Math.random() * 200 + "px";

    document.body.appendChild(meteor);

    setTimeout(() => {
        meteor.remove();
    },3000);

}

setInterval(() => {

    createMeteor();

},1500);

// ดาวกระพริบ

for(let i = 0; i < 50; i++){

    const star = document.createElement("div");

    star.style.position = "fixed";

    star.style.width = "2px";
    star.style.height = "2px";

    star.style.borderRadius = "50%";

    star.style.background = "white";

    star.style.left =
    Math.random() * window.innerWidth + "px";

    star.style.top =
    Math.random() * window.innerHeight + "px";

    star.style.opacity =
    Math.random();

    star.style.pointerEvents = "none";

    star.style.zIndex = "-1";

    document.body.appendChild(star);

    setInterval(() => {

        star.style.opacity =
        Math.random();

    },1000);

}