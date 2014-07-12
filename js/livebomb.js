//Live Bomb UI
$(function() {

    $(".custom-scroll").slimScroll({
        height: '280px',
        distance:'6px',
        size: '8px',
        railOpacity: 0,
    });

    //Default Settings
    if (storage.isSet('preferences') === false) {
        storage.set({
            'preferences': 'default',
            'notification': true,
            'timer': 300000,
            'theme': 'dark',
            'notification-sound': true,
            'sound': 'dropbomb',
            'schedule-bagde': true,
            'show-schedule': true
        });

        scheduleCounter = 0;
    }

    //Fix popup styling for Mac users
    if (navigator.appVersion.indexOf('Mac') !== -1) {
        $('body').css('border','1.5px solid');
    }

    //Update settings value
    if (storage.get('preferences') === 'user-preference') {
        if (storage.get('notification') === false ) {
            $('input:radio[name=notification]').prop('checked', true);;
        }

        if (storage.get('notification-sound') === false ) {
            $('input:radio[name=sound]').prop('checked', true);;
        }

        if (storage.get('schedule-bagde')) {
            $('input:radio[id=schedule-bagde]').prop('checked', true);;
        }

        if (storage.get('show-schedule') === false){
            $('input:radio[id=show-schedule-no]').prop('checked', true);;
        }

        $('input:radio[value=' + storage.get('sound') + ']').prop('checked', true);;
    }

    if (storage.isSet('islive') === false) {
        storage.set('islive', false);
    }

    //GA
    ga('send', 'pageview', '/popup.html');

    //InterfaceCaching
    var buttonLive = $('#lb-live');
    var buttonSchedule = $('#lb-schedule');

    var buttonRefresh = $('#lb-refresh-button');
    var buttonRefreshSchedule = $('#lb-refresh-schedule');

    var buttonLightTheme = $('#light-theme');
    var buttonDarkTheme = $('#dark-theme');
    var buttonAboutOfflineClose = $('#offline-about-close');
    var pageStatus = $('#lb-page-status');
    var pageAbout =  $('#lb-page-about');
    var pageSchedule = $('#lb-page-schedule');

    var timer = $('#lb-slider-time');
    var timerValue = $('#lb-slider-value');
    var statusOnline = $('#lb-status-live');
    var statusOffline = $('#lb-status-offline');
    var cfgMessage = $('#lb-settings-message');
    var scheduleItems = $('#lb-schedule-items');

    //Set theme
    if (storage.get('theme') === 'light') {
        buttonDarkTheme.removeClass('active');
        buttonLightTheme.addClass('active');
        $('body').addClass('livebomb-light');
        $('body').removeClass('livebomb-dark');
        ga('send', 'event', 'theme', 'light');
    } else {
        ga('send', 'event', 'theme', 'dark');
    }

    //Get Preferences
    //Notification
    timer.slider({
        step: 60000,
        min: 60000,
        max: 1800000,
        slide: function(event, ui) {
            timerValue.text('Every ' + ui.value / 60000 + ' min');
        },
        create: function(event, ui) {
            timerValue.text('Every ' + storage.get('timer') / 60000 + ' min');
            timer.slider('option', 'value', storage.get('timer'));
        },
        stop: function(event,ui) {
            cfgMessage.fadeIn(700).fadeTo(350, 1).fadeOut(400);
            storage.set('timer', ui.value);
        }
    });

    var scrollOptions;

    if (storage.get('theme') === 'dark') {
        scrollOptions = {
            height: '280px',
            color: '#fff',
            distance:'6px',
            size: '8px',
        };
    } else {
        scrollOptions = {
            height: '280px',
            color: 'black',
            distance:'6px',
            size: '8px',
            railOpacity: 0,
        };
    }

    $('.custom-scroll').slimScroll(scrollOptions);

    //Save Preferences automatically
    $('input').change(function() {
        if (this.checked) {
            //Display "Saved" message.
            storage.set('preferences','user-preference');
            cfgMessage.fadeIn(700).fadeTo(350, 1).fadeOut(400);

            //Save the new value.
            storage.set(this.name, this.value);

            //Trigger the icon badge to update.
            $('body').trigger('checkBadge');
        }
    });

    //Update schedule badge on change
    $('body').on('checkBadge',function() {
        if (storage.get('schedule-bagde') === false && gbLive !== true) {
            chrome.browserAction.setBadgeText({text: ''});
        }

        if (storage.get('schedule-bagde') === true && gbLive !== true && scheduleCounter > 0) {
            chrome.browserAction.setBadgeText({text:'' + scheduleCounter + ''});
        }
    });

    //Set default view
    cfgMessage.hide();

    if (storage.get('islive') === false && storage.get('show-schedule') === true) {
        $('[href="#lb-page-schedule"]').tab('show');
    } else if (storage.get('islive') === false && storage.get('show-schedule') === false) {
    } else {
        chrome.browserAction.setBadgeText({text: 'LIVE'});
        $('#lb-status-live').css('background-image', 'url("' + storage.get('liveImage') + '")');
        statusOnline.show();
        statusOffline.hide();
        $('#button-icon').css('color', 'red');
        $('#show-name').html(storage.get('title'));
    }

    //Interface refresh for live video event
    $('body').on('statusLive',function() {
        if (statusOffline.is(':visible')) {
            statusOffline.fadeOut(200, function() {
                statusOnline.fadeIn(200);
                $('#button-icon').css('color', 'red');
                $('#show-name').html(storage.get('title'));
            });
        }

        if (pageSchedule.is(':visible')) {
            pageSchedule.fadeOut(300, function() {
                pageStatus.fadeIn(300);
                statusOffline.hide();
                statusOnline.show();
                buttonSchedule.toggleClass('active');
                buttonLive.toggleClass('active');
                $('#button-icon').css('color', 'red');
                $('#show-name').html(storage.get('title'));
            });
        }
    });

    //Refresh for offline video
    $('body').on('statusNotLive',function() {
        if (statusOnline.is(':visible')) {
            statusOnline.fadeOut(200,function() {
                statusOffline.fadeIn(200);
            });
        }
    });

    //Status refresh
    buttonRefresh.click(function() {
        ga('send', 'event', 'button', 'click', 'status-refresh');

        buttonRefresh.removeClass('fa-refresh').addClass('fa-cog fa-spin');

        checkLive().done(function() {
            buttonRefresh.removeClass('fa-cog fa-spin').addClass('fa-refresh');

            if (gbLive === true) {
                statusOnline.show();
                statusOffline.hide();

                chrome.browserAction.setBadgeText({ text: 'LIVE' });

                $('#button-icon').css('color', 'red');
                $('#show-name').html(storage.get('title'));

                if (sendMessage === true && storage.get('notification') === true) {
                    chrome.notifications.create('notify', options, function() {
                        sendMessage = false;
                    });
                }
            } else {
                sendMessage = true;
                statusOffline.show();
                statusOnline.hide();

                if (storage.get('notification') === false) {
                    chrome.browserAction.setBadgeText({text: ''});
                }
            }
        });
    });

    //Schedule refresh
    buttonRefreshSchedule.click(function() {
        ga('send', 'event', 'button', 'click', 'schedule-refresh');

        $(this).removeClass('fa-refresh').addClass('fa-times');

        scheduleItems.fadeOut(200, function() {
            $(this).html('');
            window.scheduleLoadingIcon.fadeIn(300);
        });

        getSchedule().done(function() {
            window.scheduleLoadingIcon.effect('fadeOut', 2000, function() {
                $(this).fadeOut(300);
                scheduleItems.fadeIn(100);
            });

            buttonRefreshSchedule.removeClass('fa-times').addClass('fa-refresh');
        });
    });

    // About Close Button
    buttonAboutOfflineClose.click(function() {
        pageAbout.removeClass('active');
        var lastPageID = $('#lb-controls li.active a').attr('href');
        $(lastPageID).addClass('active');
    });

    //Light Theme
    buttonLightTheme.click(function(){
        ga('send', 'event', 'button', 'click', 'light-theme');
        $('body').removeClass('livebomb-dark').addClass('livebomb-light');
    });

    //Dark Theme
    buttonDarkTheme.click(function() {
        ga('send', 'event', 'button', 'click', 'dark-theme');
        $('body').removeClass('livebomb-light').addClass('livebomb-dark');
    });

    //Test Sounds
    $('[data-playsound]').click(function() {
        audio.playSound($(this).attr('data-playsound'));
    });

    // Windows Hide Scrollbar Hack
    // TODO: I HAVE NO IDEA WHY THIS IS NECESSARY OR WHY IT WORKS!
    setTimeout(function() {
        $('body').height('379px');

        setTimeout(function() {
            $('body').height('');
        }, 100);
    }, 100);

    // Prevent flash of unstyled content
    $('html').show();

});
