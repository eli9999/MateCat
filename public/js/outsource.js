$.extend(UI, {
	outsourceInit: function() {
		$(".outsourceto .uploadbtn").click(function(e) {
			e.preventDefault();
		});
		$(".outsource").click(function() {
			$( ".outsourcemodal" ).show();
		});

		$(".more").click(function(e) {
			e.preventDefault();
			$(".content").toggle();
		});
		$(".more-table").click(function(e) {
			e.preventDefault();
			$(".content-table").toggle();
		});

        $( ".showprices" ).click(function() {
            $( this ).hide();
            $( ".revealprices" ).show();
        });

        //Added .translate class in html button because of double call to
        //API when displaying prices on showprices button ( class .in-popup was removed and .uploadbtn was too much widely used... )
		$(".translate").click(function(e) {
			var linkPieces = $( this ).attr( "href" ).split( "/" );
			var jPieces = linkPieces[ linkPieces.length - 1 ].split( "-" );
			var words = $( ".tablestats[data-pwd='" + jPieces[ 1 ] + "'] .stat-payable" ).text();

			$( ".title-source" ).text( $( "div[data-jid='" + jPieces[ 0 ] + "'] .source_lang" ).text() );
			$( ".title-target" ).text( $( "div[data-jid='" + jPieces[ 0 ] + "'] .target_lang" ).text() );
			$( ".title-words" ).text( words );

			if(config.enable_outsource) {
				e.preventDefault();
				chunkId = $(this).parents('.totaltable').find('.languages .splitnum').text();
				row = $(this).parents('.tablestats');
				$('.modal.outsource .outsourceto h2').addClass('loading');

				var display_boxPrice = false;

				APP.doRequest({
					data: {
						action: 'outsourceTo',
						pid: $('#pid').attr('data-pid'),
						ppassword: $("#pid").attr("data-pwd"),
						jobs: [
							{
								jid: row.attr('data-jid'),
								jpassword: row.attr('data-pwd')
							}
						]
					},
					context: chunkId,
					error: function() {
		//						UI.failedConnection(0, 'outsourceToTranslated');
					},
					success: function(d) {

                        //IMPORTANT this store the quote response to a class variable
                        //to be posted out when Order Button is pressed
                        UI.quoteResponse = d.data;

						chunks = d.data;
						chunkId = this;
						ind = 0;
						$.each(chunks, function(index) {
							if(this.id == chunkId) ind = index;
						});
						chunk = d.data[ind];

                        UI.url_ok = d.return_url.url_ok;
                        UI.url_ko = d.return_url.url_ko;
                        UI.data_key = row.attr('data-jid') + "-" + row.attr('data-pwd');

                        if( chunk.price == 0 && chunk.words == '' ){
                            console.log('Oops we got an error...');
                            $('.tpricetitle' ).text('' ).css({'border-bottom':'none'});
                            $('.outsource.modal .total span.euro' ).text( '' );
                            $('.outsource.modal .total span.displayprice' ).text( '' );
                            $('.outsource.modal .delivery span.zone2').text( '' );
                            $('.outsource.modal .delivery').text( 'Ops we got an error, try again.' );
                            $('.modal.outsource .outsourceto h2').removeClass('loading');
                            $('.outsource.modal').show();
                            $(".showprices" ).show();
                            return false;
                        }

                        // if the customer has a timezone in the cookie, then use it
                        // otherwise attemp to guess it from his browser infos
                        var timezoneToShow = readCookie( "matecat_timezone" );
                        if ( timezoneToShow == "" ) {
                            timezoneToShow = -1 * ( new Date().getTimezoneOffset() / 60 );
                        }

                        // update the timezone (both the displayed and the stored ones)
                        changeTimezone( chunk.delivery_date, "0", timezoneToShow );
                        $( "#changeTimezone option[value='" + timezoneToShow + "']").attr( "selected", "selected" );
                        /**
                         * Removed Timezone with Intl because of too much different behaviours on different operating systems
                         *
                         */

						$('.outsource.modal .continuebtn').removeClass('disabled');
//						console.log( chunk );
						$('.modal.outsource .outsourceto h2').removeClass('loading');

						//this tell to the ui if price box sould be displayed immediately
						if( chunk.show_info == '1' ){
							$(".showprices" ).click();
						} else {
							$(".showprices" ).show();
						}

                        // if the customer has a currency in the cookie, then use it
                        // otherwise use the default one
                        var currToShow = readCookie( "matecat_currency" );
                        if ( currToShow == "" ) {
                            currToShow = "EUR";
                        }

                        // update the currency (both the displayed and the stored ones)
                        changeCurrency( chunk.price, "EUR", currToShow );
                        $( "#changecurrency option[value='" + currToShow + "']").attr( "selected", "selected" );
                    }
				});
				$('.outsource.modal input.out-link').val(window.location.protocol + '//' + window.location.host + $(this).attr('href'));
				$('.outsource.modal .uploadbtn').attr('href', $(this).attr('href'));

				$('.outsource.modal').show();
				return false;
			}
		});

		$(".outsourcemodal").on('click', '.chunks input', function(e) {
			e.stopPropagation();
			UI.setPrices();
//		}).on('click', '.outsourcemodal .x-popup', function(e) {
//			UI.showOutsourceChoice();
		}).on('click', '.chunks td.outs', function(e) {
			e.stopPropagation();
			ch = $(this).find('input');
			if($(ch).attr('checked')) {
				$(ch).removeAttr('checked');
			} else {
				$(ch).attr('checked', 'checked');
			}
			UI.setPrices();
//		}).on('click', '.back', function(e) {
//			e.preventDefault();
//			UI.showOutsourceChoice();
		})

		$(".outsource.modal").on('click', '.continuebtn:not(.disabled)', function(e) {
			e.preventDefault();

            updateCartParameters();

			$('#continueForm input[name=url_ok]').attr('value', UI.url_ok);
			$('#continueForm input[name=url_ko]').attr('value', UI.url_ko);
            $('#continueForm input[name=data_key]').attr('value', UI.data_key);

            //IMPORTANT post out the quotes
			$('#continueForm input[name=quoteData]').attr('value', JSON.stringify( UI.quoteResponse ) );
			$('#continueForm').submit();
            $('#continueForm input[name=quoteData]').attr('value', '' );
		}).on('click', '.continuebtn.disabled', function(e) {
			e.preventDefault();
		});

		$("body").on('click', '.modal.outsource .x-popup', function(e) {
			$('.modal.outsource .displayprice').empty();
			$('.modal.outsource .delivery .time').empty();
			$('.modal.outsource .revealprices, .modal.outsource .showprices').hide();
		});

        $( "#changecurrency" ).change( function(){
            var amount      = $( ".displayprice").attr( "data-rawprice" );
            var currencyFrom = $( ".displayprice").attr( "data-currency" );
            var currencyTo  = $( "#changecurrency option:selected" ).val();
            changeCurrency( amount, currencyFrom, currencyTo );
        });

        $( "#changeTimezone" ).change( function(){
            var date = $( "span.time").attr( "data-rawtime" );
            var timezoneFrom = $( "span.time").attr( "data-timezone" );
            var timezoneTo = $( "#changeTimezone option:selected" ).val();
            changeTimezone( date, timezoneFrom, timezoneTo );
        });
	},
	getFarthestDate: function() {
		farthest = new Date(0);
		$('.outsourcemodal .chunks tr:not(.thead):has(input[checked=checked])').each(function() {
			dd = new Date($(this).attr('data-delivery'));
			if(dd.getTime() > farthest.getTime()) farthest = dd;
		})

        var timeOffset = ( -dd.getTimezoneOffset() / 60 );

        //check for international API support on ECMAScript
        if ( window.Intl && typeof window.Intl === "object" ){
            //Assume it's supported, lets localize
            var timeZone   = Intl.DateTimeFormat().resolved.timeZone.replace('San_Marino', 'Rome');
            var extendedTimeZone = '( GMT ' + ( timeOffset > 0 ? '+' : '' ) + timeOffset + ' ' + timeZone + ' )';
            $('.outsource.modal .total span.displayprice').text( Intl.NumberFormat('en').format( chunk.price ) );
        } else {
            var extendedTimeZone = '( ' + dd.toString().replace(/^.*GMT.*\(/, "").replace(/\)$/, "") + ' - GMT ' + ( timeOffset > 0 ? '+' : '' ) + timeOffset + ' )';
            $('.outsource.modal .total span.displayprice').text( parseFloat( chunk.price ).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') );
        }

		return $.format.date(farthest, "D MMMM") + ' at ' + $.format.date(farthest, "hh:mm") + ' ' + extendedTimeZone;
	}
//	showOutsourceChoice: function() {
//		$('.outsourcemodal h1').text('Here is the link to your new translation job');
//		$('.outsourcemodal section.outs').hide();
//		$('.outsourcemodal section.choose').show();
//	},
});



function changeCurrency( amount, currencyFrom, currencyTo ) {
    APP.doRequest({
        data: {
            action: 'changeCurrency',
            amount: amount,
            currencyFrom: currencyFrom,
            currencyTo: currencyTo
        },
        success: function (d) {
            $( ".euro" ).text( $( "#changecurrency" ).find( "option[value='" + currencyTo + "']" ).attr( "data-symbol" ) );
            $( ".displayprice" ).text( parseFloat( d.data).toFixed( 2 ) );
            $( ".displayprice" ).attr( "data-rawprice", d.data );
            $( ".displayprice" ).attr( "data-currency", currencyTo );

            var numWords = parseFloat( $(".title-words").text().replace( ",", "" ) );
            $( "#price_p_word").text( ( parseFloat( d.data ) / numWords ).toFixed( 3 ) );

            document.cookie = "matecat_currency=" + currencyTo + "; path=/";
        }
    });
}

function changeTimezone( date, timezoneFrom, timezoneTo ){
    var dd = new Date(date);
    dd.setMinutes( dd.getMinutes() + (timezoneTo - timezoneFrom) * 60 );
    $('.outsource.modal .delivery span.time').text( $.format.date(dd, "D MMMM") + ' at ' + dd.getUTCHours() + ":" + $.format.date(dd, "mm") );

    $( "span.time").attr("data-timezone", timezoneTo);
    $( "span.time").attr("data-rawtime", dd.toUTCString());

    document.cookie = "matecat_timezone=" + timezoneTo + "; path=/";
}

function readCookie( cookieName ) {
    cookieName += "=";
    var cookies = document.cookie.split(';');

    for ( var i = 0; i < cookies.length; i++ ) {
        var cookie = cookies[i].trim();

        if ( cookie.indexOf( cookieName ) == 0 )
            return cookie.substring( cookieName.length, cookie.length );
    }
    return "";
}

function updateCartParameters() {
    var linkPieces = $( "a.uploadbtn.in-popup").attr( "href").split( "/" );
    var jobData = linkPieces[ linkPieces.length - 1].split( "-" );

    APP.doRequest({
        data: {
            action: 'outsourceTo',
            pid: $('#pid').attr('data-pid'),
            ppassword: $("#pid").attr("data-pwd"),
            jobs: [
                {
                    jid: jobData[0],
                    jpassword: jobData[1]
                }
            ]
        },
        success: function () {}
    });

}