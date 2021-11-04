const url = "http://localhost:8000/get-journey?start=" + start + "&end=" + end + "&count=3";

let formData = null;
let xhr = new XMLHttpRequest();

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === 4) {
    if(this.status === 200) {
      //call your function here, alternatively you can wrap it around a Promise and return the result
      let result = JSON.parse(this.responseText);
      console.log(result);
     }
  }
});

xhr.open("GET", url);
xhr.send(formData);