var json = localStorage.getItem("query_history");
var query_history = [];
if (json != null && json != "null" && json.length > 0) {
  try {
    query_history = JSON.parse(json);
  } catch (ex) {
    query_history = [];
  }
 }

function xmlhttp_post(url, data, callback)
{
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange =
        function() {
            if (xmlhttp.readyState==4) {
                if (xmlhttp.status==200)
                    callback(xmlhttp, url);
                else
                    alert("XMLHTTP request to "+url+" got status "+xmlhttp.statusText+". Cross-domain request?");
            }
        };

    xmlhttp.open("POST", url, true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    // this header must be set by the browser. the standard says a browser should
    // terminate a request if Content-length or Connection are specified.
    //    xmlhttp.setRequestHeader("Content-length", data.length);

    xmlhttp.send(data);
}
