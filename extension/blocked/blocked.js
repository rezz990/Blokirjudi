document.querySelector("#back").addEventListener("click", () => history.length > 1 ? history.back() : window.close());
