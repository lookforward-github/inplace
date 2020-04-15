function dragControls() {
    if (event.pageX != 0 && event.pageY != 0) {
        controls.style.left = event.pageX + 'px';
        controls.style.top = event.pageY + 'px';
        setCookie('controls', JSON.stringify({
            left: controls.style.left,
            top: controls.style.top
        }));
    }
}

function initControls() {
    let pos = JSON.parse(getCookie('controls', '{"left": "0px", "top": "0px"}'));
    controls.style.left = pos.left;
    controls.style.top = pos.top;
}

initControls();