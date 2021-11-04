var DATA_COUNT = 50;         
var MAX_LABEL_LENGTH = 30; 
      
var data = [];
 
for (var i = 0; i < DATA_COUNT; i++) {
    var datum = {};
    datum.label = stringGen(MAX_LABEL_LENGTH)
    datum.value = Math.floor(Math.random() * 600);
    data.push(datum);
}
    
function stringGen(maxLength) {
    var text = "";
    var charset = "abcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < getRandomArbitrary(1, maxLength) ; i++ ) {
        text += charset.charAt(Math.floor(Math.random() * charset.length));
    }                                                

    return text;
}
  
function getRandomArbitrary(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}  



// console.log(data.map(function(d){ return d.label.length}));

var dt = [{'sent': 4, 'received': 4, 'year': 2001, 'month': 9, 'day': 1}, {'sent': 1, 'received': 1, 'year': 2001, 'month': 9, 'day': 2}]
console.log(dt[0].data)