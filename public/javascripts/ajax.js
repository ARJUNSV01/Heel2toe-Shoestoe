const { response } = require("express");

function deleteItem(cartId) {
    $.ajax({
      url: '/cart/delete/'+cartId,
      method: 'get',
      success(response) {
        if (response.deleted) {
          window.location.reload();
        }
      },
    });
  }
  function deleteAll(){
      $.ajax({
          url:'/clearCart',
          method:'get',
          success(response){
              if(response.deleted){
                  window.location.reload()
              }
          }
      })
  }
  function addCount(cartId){
    $.ajax({
      url:'/addcount/'+cartId,
      method:'get',
      success(response){
        if(response.added){
          
          window.location.reload()
        }
      }
    })
  }
  function subCount(cartId){
    $.ajax({
      url:'/subcount/'+cartId,
      method:'get',
      success(response){
        if(response.sub){
          
          window.location.reload()
        }
      }
    })
  }
  
  