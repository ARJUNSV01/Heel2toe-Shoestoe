

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
  // function sortProducts(sortBy){
  //   $.ajax({
  //     url:'/sortedProducts/'+sortBy,
  //     method:'get',
  //     success(response){
  //       alert(response)
  //     }
  //   })
  // }

    $('#brandFilter').submit((e)=>{
    e.preventDefault()
    $.ajax({
      url:'/products/filter',
      method:'post',
      data:$('#brandFilter').serialize(),
      success:(status)=>{
          
         
        // if(status){
        //   console.log(status)
            $('#filteredProducts').load(location.href + " #filteredProducts"); 

        //  $('#filteredProducts').load(location.href + " #filteredProducts");
          
      }
    })
  })

  // $('input[name=brandName')

  
    

  