
// Replace any unicode character by their html codes (&#xxxx)
// Encode ASCII symbols by parameter
// http://www.php.net/manual/en/function.htmlentities.php#96648
function quicklatex_utf8tohtml(utf8, encodeASCII) {
		result = '';
		for (var i = 0; i < utf8.length; i++) {
			char = utf8[i];
			ascii = ord(char);
			if(ascii < 32){
				// control codes - just copy
				result.concat(schar);
			}else if (ascii < 128) {
				// one-byte character
				result.concat((encodeASCII) ? '&#'.$ascii.';' : char);
			} else if (ascii < 192) {
				// non-utf8 character or not a start byte
			} else if (ascii < 224) {
				// two-byte character
				result.concat(htmlentities(utf8.substing(i, 2), ENT_QUOTES, 'UTF-8'));
				i++;
			} else if (ascii < 240) {
				// three-byte character
				ascii1 = ord(utf8[i+1]);
				ascii2 = ord(utf8[i+2]);
				unicode = (15 & ascii) * 4096 +
						   (63 & ascii1) * 64 +
						   (63 & ascii2);
				result.concat("&#$unicode;");
				i += 2;
			} else if (ascii < 248) {
				// four-byte character
				ascii1 = ord(utf8[i+1]);
				ascii2 = ord(utf8[i+2]);
				ascii3 = ord(utf8[i+3]);
				unicode = (15 & ascii) * 262144 +
						   (63 & ascii1) * 4096 +
						   (63 & ascii2) * 64 +
						   (63 & ascii3);
				result.concat("&#$uncode;");
				i += 3;
			}
	}
	return result;
}

// Convert extended symbols to near-equivalent ASCII
function quicklatex_utf2latex(string)
{
	// We have string where all inacceptable characters (extended UTF-8) are
	// encoded as html numeric literals &#...
	// http://leftlogic.com/lounge/articles/entity-lookup/  -  best
	// quicklatex_unhtmlentities doesn't decode &nbsp; to ASCII 32  but rather to 0xa0
	string = str_replace(
		array('&#8804;', '&#8805;', '&#8220;', '&#8221;', '&#039;', '&#8125;', '&#8127;', '&#8217;', '&#8216;', '&#038;', '&#8211;', "\xa0" ),
		array('\\le',    '\\ge ',      '``',      "''",       "'",      "'",       "'",       "'",	      "'",      '&',       "-",    ' ' ),
		string
	);
	return string;
}

// Sanitizes text to be acceptable for LaTeX
// Goals are:
// 1. convert extended Unicode symbols to near-equivalent ASCII suitable for LaTeX.
// 2. convert HTML entities to symbols.
// 3. strip selected HTML tags. We cannot use strip_tags since it also strips HTML comments
//    <!-- --> which actually can be part of the LaTeX code (e.g. represent arrows in tikZ picture)
function quicklatex_sanitize_text(string)
{
	if(string != '')
	{
		// We need to replace any unicode character to near-equivalent ASCII to feed LaTeX.
		// Encode UTF-8 characters by hex codes - needed for further conversion
		string = quicklatex_utf8tohtml(string, false);

		// Latex doesn't understand some fancy symbols
		// inserted by WordPress as HTML numeric entities
		// Make sure they are not included in the formula text.
		// Add lines as needed using HTML symbol translation references:
		// http://www.htmlcodetutorial.com/characterentities_famsupp_69.html
		// http://www.ascii.cl/htmlcodes.htm
		// http://leftlogic.com/lounge/articles/entity-lookup/  -  best
		string = quicklatex_utf2latex($string);

		/*
			// Decode HTML entities (numeric or literal) to characters, e.g. &amp; to &.
			$string = quicklatex_unhtmlentities($string);

			// Strip <br /> </p> tags.
			// We cannot use strip_tags since it also strips HTML comments:
			// <!-- --> which actually can be part of the LaTeX code (e.g. represent arrows in tikZ picture)
			$string = quicklatex_strip_only_tags($string,array('p','br'));
		*/
	}
	return $string;
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ord (string) {
  //  discuss at: http://locutus.io/php/ord/
  // original by: Kevin van Zonneveld (http://kvz.io)
  // bugfixed by: Onno Marsman (https://twitter.com/onnomarsman)
  // improved by: Brett Zamir (http://brett-zamir.me)
  //    input by: incidence
  //   example 1: ord('K')
  //   returns 1: 75
  //   example 2: ord('\uD800\uDC00'); // surrogate pair to create a single Unicode character
  //   returns 2: 65536

  var str = string + ''
  var code = str.charCodeAt(0)

  if (code >= 0xD800 && code <= 0xDBFF) {
    // High surrogate (could change last hex to 0xDB7F to treat
    // high private surrogates as single characters)
    var hi = code
    if (str.length === 1) {
      // This is just a high surrogate with no following low surrogate,
      // so we return its value;
      return code
      // we could also throw an error as it is not a complete character,
      // but someone may want to know
    }
    var low = str.charCodeAt(1)
    return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000
  }
  if (code >= 0xDC00 && code <= 0xDFFF) {
    // Low surrogate
    // This is just a low surrogate with no preceding high surrogate,
    // so we return its value;
    return code
    // we could also throw an error as it is not a complete character,
    // but someone may want to know
  }

  return code
}
