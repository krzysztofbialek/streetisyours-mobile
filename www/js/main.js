$( document ).ready(function() {
  const backendUrl = "http://street-is-yours.herokuapp.com/api";

  var url = window.localStorage.getItem('current-photo')
  
  // if(!window.localStorage.getItem("api-token")) {
  //   $.mobile.navigate("#login");
  // }



  $('#welcome, #back-to-camera').click(function() {
    navigator.camera.getPicture(function(imageData){
      window.localStorage.setItem('current-photo', "data:image/jpeg;base64," + imageData);
      navigator.geolocation.getCurrentPosition(function(position) {
        setupForm(position);
        console.log(position);

        // Show latest photos
        $.when( $.ajax({url: backendUrl + '/issues?latitude=' + position.coords.latitude + '&' + 'longitude=' + position.coords.longitude + '&limit=3' }) ).then(function( payload, textStatus, jqXHR ) {
          $('#nearby-issues').show();
          $('#nearby-issues ul').html('');
          $.each(payload.data, function( index, issue ) {
            $('#nearby-issues ul').append('<li class="issue" style="background: url(' + issue.attributes.image  + ') no-repeat center center; background-size: cover;"><span class="ok"></span></li>')
          });
        });
      });

    }, function(){}, {
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: 1,
      encodingType: Camera.EncodingType.JPEG,
      targetWidth: 720,
      correctOrientation: true
    });  
  })

  $('#nearby-issues').on('click', function() {
    $.mobile.navigate("#welcome");
    $('#nearby-issues').hide();
  });

  $('.clear-cookie').click(function() {
    window.localStorage.clear();
    $.mobile.navigate("#login");    
  })

  $('.set-cookie').click(function() {
    window.localStorage.setItem('api-token', 'HODOR');    
  })

  $('form#login').on('submit', function(event) {
    event.preventDefault();
    var form = $(this);

    login(form);
  })

  $('form#add-item').on('submit', function(event) {
    event.preventDefault();
    var form = $(this);
    var apiToken = window.localStorage.getItem('api-token')

    $.mobile.loading('show');

    $.ajax({
      type: 'POST',
      beforeSend: function(request) {
        request.setRequestHeader("X-Auth-Token", apiToken);
      },
      // url: "http://10.0.3.2:3000/api/v1/" + permalink + "/items",
      url: backendUrl + '/issues',
      data: form.serialize(),
      dataType: 'json'
    }).done(function(data) {
      $.mobile.loading('hide');

      $('#item-added-notice').show();
      $('form#add-item').hide();
      $('form#add-item')[0].reset();
      $('.error').hide();

      setTimeout(function() {
        $.mobile.navigate("#welcome");
        $('#item-added-notice').hide();
      }, 3000);
    }).fail(function(error) {
      $.mobile.loading('hide');
      console.log(error)
      $('.error').text(JSON.parse(error.responseText).error);
      $('.error').show();
    });
  })

  function login(form) {
    $.mobile.loading('show');

    var subdomain = getSubdomain(form);

    if(!subdomain) {
      return;
    }
    
    $.ajax({
      type: "POST",
      // url: "http://10.0.3.2:3000/api/v1/sessions",
      url: backendUrl,
      data: form.serialize(),
      dataType: 'json',
    }).done(function(data) {
      storeData(data);

      $.mobile.loading('hide');
      $.mobile.navigate("#welcome");
      $('form#login')[0].reset();
      $('.error').hide();
    }).fail(function(error) {
      $.mobile.loading('hide');
      console.log(error)
      $('.error').text(JSON.parse(error.responseText).error);
      $('.error').show();
    });
  }

  function storeData(data) {
    window.localStorage.setItem('api-token', data.user.api_token);
    window.localStorage.setItem('categories', JSON.stringify(data.meta.categories));
  }

  function getSubdomain(form) {
    var subdomain = form.find('input[name="subdomain"]').val();
    if(subdomain) {
      return subdomain;
    } else {
      $('.error').text("subdomain can't be empty")
      $('.error').show();
    }
  } 

  function setupForm(position) {
    var lat, lng;
    var image = document.getElementById('item-preview');
    var issueFormPage = document.getElementById('item-form-page');
    var imageData = window.localStorage.getItem('current-photo');

    lat = position.coords.latitude;
    lng = position.coords.longitude;

    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;

    issueFormPage.style.background = "url(" + imageData + ") no-repeat center";  
    // image.src = imageData;
    var categories = [{id: 'street_light', name: 'Street lights'}, {id: 'road', name: 'Roads'}] //JSON.parse(window.localStorage.getItem('categories'));
    $('#image-data').val(imageData);

    for(i=0;i<categories.length;i++){
      $('#category-preview').append("<option value='"+categories[i].id+"'>"+categories[i].name+"</option>");
    }

    // show form if it was previously hidden
    $('form#add-item').show();
    $.mobile.navigate("#item-form-page");
  }
});

$( document ).bind( "mobileinit", function() {
    // Make your jQuery Mobile framework configuration changes here!

    $.mobile.allowCrossDomainPages = true;
});
