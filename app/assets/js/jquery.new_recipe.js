/*jslint browser: true, plusplus: true */
/*global $, console, jQuery*/
$(document).ready(function () {
  "use strict";

  $('nav ul li#new_recipe').hide();
  // Auto resize textareas
  $("textarea").autosize();

  /**----------------------------------------------------------------
                "Lägg till set", event handlers för att ta bort etc
        -----------------------------------------------------------------*/
  function addSet() {
    // Lägger till ett set till ingredientsDiv
    $('#ingredientsDiv').append('<div class="set"><input name="setHeading" class="setHeading" type="text" /><a tabindex="-1" class="icon">ç</a></div>');
    $('.set:last').hide().fadeIn('normal'); // animera ingången
    $('.set').removeAttr('id'); // avmarkera alla set
    $('.set:last').attr('id', 'selectedSet'); // markera det nyligen tillagda
    $('#addIngredient').trigger('click'); // Lägg till en ingrediens
    $('.set:last input:first').focus(); // sätt fokus i det nyligen skapade set:et

    // Event handler - markera set som klickas
    $('.set').each(function () {
      $(this).click(function () {
        // Avmarkera alla set
        $('.set').removeAttr('id');
        // Markera detta set
        $(this).attr('id', 'selectedSet');
      });
    });

    // Event handler - ta bort set som klickas
    $('.set a').each(function () {
      $(this).click(function () {
        $(this).parent('.set').fadeOut('normal', function () {
          $(this).remove();
        });
      });
    });

    // Event handler - temporärt markera set som hovras
    $('.set').each(function () {
      $(this).hover(function () {
        $(this).addClass('hoveredSet');
      }, function () {
        // när hovring är klar
        $(this).removeClass('hoveredSet');
      });
    });
  }

  // Bind event handler
  $('#addSet').click(function () { addSet(); });


  /**----------------------------------------------------------------
                "Lägg till ingrediens", event handlers för att ta bort etc.
        -----------------------------------------------------------------*/
  function addIngredient() {
    // Lägger till i markerat set och binder event handlers
    $('<div class="ingredients"><input name="ingredient" type="text" /><a tabindex="-1" class="icon">ç</a></div>').appendTo('#selectedSet').hide().fadeIn('normal').on('keydown', function (key) {
      // Event handler: om sista ingrediens ej tom, i set och användare trycker 'tab' -> lägg automatiskt till ny ingrediens
      var keyCode = key.keyCode || key.which;
      if (keyCode === 9 && $(this).is(":last-child")) {
        if ($(this).children('input[name="ingredient"]').val() !== "") {
          key.preventDefault();
          addIngredient();
          $("#selectedSet:last input").focus();
        } else {
          // Vi har förmodligen lagt till en ingrediens i onödan - ta bort
          $("#selectedSet .ingredients:last").fadeOut('fast', function () {
            $(this).remove();
          });
        }
      }
    });

    $('#selectedSet:last input').focus(); // sätt fokus i den nyligen skapade ingrediensen

    // Event handler till ingrediens-remove-knapparna (blir egentligen trippla för första ingredienser...)
    $('.ingredients a ').each(function () {
      $(this).click(function () {
        $(this).parent('.ingredients ').fadeOut('normal ', function () {
          $(this).remove();
        });
      });
    });
  }

  // Bind event handler - klick på "Lägg till ingrediens"
  $('#addIngredient').click(function () { addIngredient(); });

  /**----------------------------------------------------------------
                "Lägg till taggar", event handlers för att ta bort etc.
        -----------------------------------------------------------------*/
  function addTag() {
    // Om rubrik inte finnns, lägg till
    if (!$('#tagsDiv .icon').length) {
      $('#tagsDiv').append('<div class="icon">l</div>');
    }

    // Lägg till tag till tagsDiv
    $('<div class="tags"><input name="tag" type="text" /><a tabindex="-1" class="icon">ç</a></div>').appendTo('#tagsDiv');
    $('.tags:last input').focus(); // sätt fokus i den nyligen skapade taggen

    // Event handler till tag-remove-knapparna
    $('.tags a').each(function () {
      $(this).click(function () {
        $(this).parent('.tags').fadeOut('normal', function () {
          $(this).remove();
        });
      });
    });
  }

  // Bind event handler
  $('#addTag').click(function () { addTag(); });


  var selectors = {}
  selectors['receptfavoriter.se'] = {
    title: '.header-1[itemprop=name]',
    intro: '.recipe-description .legible',
    instructions: 'li[itemprop=itemListElement]',
    ingredients: 'li[itemprop=recipeIngredient]',
    nbr_persons: 'h3[itemprop=recipeYield]',
    tags: '.tags.tag-label a'
  }
  selectors['www.ica.se'] = {
    title: 'h1.recipepage__headline',
    intro: 'p.recipe-preamble',
    instructions: '#recipe-howto ol li',
    ingredients: 'li.ingredients__list__item',
    nbr_persons: '#currentPortions',
    tags: '.related-recipe-tags__container a'
  }
  selectors['alltommat.se'] = {
  }

  $('#auto-import').on('blur', function (e) {
    var url = e.target.value;
    if (!url)
      return false;

    $.get('/reverse_proxy', { site: url }, function (data) {
      var site = new URL(url).hostname;
      var selector = selectors[site];
      if (!selector) {
        console.error("The site `" + site + "` is not supported");
        return false;
      }

      ['title', 'intro'].forEach(function(prop) {
        var propValue = $(data).find(selector[prop]).text().trim();
        $('#' + prop).val(propValue);
      });

      $('#instructions').val('');
      $(data).find(selector['instructions']).each(function (idx) {
        var value = $(this).text().trim();
        var old = $('#instructions').val();
        var step =  (idx + 1) + '. ' + value + '\n';
        $('#instructions').val(old + step);
      });

      $('.ingredients').remove();
      $(data).find(selector['ingredients']).each(function(idx) {
        var ingredient = $(this);
        console.log(ingredient);
        if (!ingredient)
          return false;
        $('input[name=ingredient]:last').val(ingredient.text().trim());
        addIngredient();
      });
      $('.ingredients:last').remove();

      var nbrPersons = $(data).find(selector['nbr_persons']).text().match(/\d+/);
      if (nbrPersons)
        $('#nbrPersons').val(nbrPersons[0]);

      $(data).find(selector['tags']).each(function(idx) {
        var tag = $(this).text().trim();
        if (tag)
          $('input[name=tag]:last').val(tag);
        addTag();
      });
      $('.tags:last').remove();


    });

  });

  /**----------------------------------------------------------------
                Allmänt - ladda in grejor, fokusera etc. när sidan laddats
        -----------------------------------------------------------------*/
  // Lägg till en tag när sidan laddats
  addTag();
  // Lägg till ett set när sidan laddas
  addSet();
  // Fyll i det första set:ets namn
  $('.set:first input[type=text]:first').attr('value', 'Ingredienser');
  // Lägg till tre ingredienser efteråt (en läggs till automatiskt)
  addIngredient();
  addIngredient();
  $('#title').focus();
});
