

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

    // $('#brandFilter').submit((e)=>{
    // e.preventDefault()
    $('input[name=brandName]').change(()=>{
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
  $('input[name=category]').change(()=>{
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


// function sort(sortBy){
//   $.ajax({
//     url:'/sortedProducts/'+sortBy,
//     method:'get',
//     success(response){
//       $('#filteredProducts').load(location.href + " #filteredProducts");
//     }
//   })
// }

$('#sortMenu').on('change',()=>{
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

function cancelOrder(orderId,cartId,productId,size,quantity){
  console.log(true,true,orderId,cartId,productId,size,quantity);
  $.ajax({
    
    url:'/cancelOrder',
    method:'get',
    data:{orderId,cartId,productId,size,quantity},
    success(){
      window.location.reload()
    }
  })
}
$('#submitReviews').submit((e)=>{
  e.preventDefault()
  $.ajax({
    url:'/submit-reviews',
    method:'post',
    data:$('#submitReviews').serialize(),
    success:(status)=>{
      if(status){
        // $('.rateProducts').load(location.href + " .rateProducts");
        // $('.rate').load(location.href + " .rate");
        window.location.reload()
      
    }

    }
  })
})
$('input[name=SbrandName]').change(()=>{
    $.ajax({
      
      url:'/products/search',
      method:'post',
      data:$('#searchAndFilter').serialize(),
      success:(status)=>{
          
         
        // if(status){
        //   console.log(status)
            $('#filteredProducts').load(location.href + " #filteredProducts"); 

        //  $('#filteredProducts').load(location.href + " #filteredProducts");
          
      }
    })
  })
  $('input[name=Scategory]').change(()=>{
    $.ajax({
      url:'/products/search',
      method:'post',
      data:$('#searchAndFilter').serialize(),
      success:(status)=>{
          
         
        // if(status){
        //   console.log(status)
            $('#filteredProducts').load(location.href + " #filteredProducts"); 

        //  $('#filteredProducts').load(location.href + " #filteredProducts");
          
      }
    })
  })
  // function sortAfterSearch(sortBy){
  //   $.ajax({
  //     url:'/products/search',
  //     method:'post',
  //     data:{sortBy},
  //     success(response){
  //       $('#filteredProducts').load(location.href + " #filteredProducts");
  //     }
  //   })
  // }
  $('#sortMenu').on('change',()=>{
    $.ajax({
      url:'/products/search',
      method:'post',
      data:$('#searchAndFilter').serialize(),
      success:(status)=>{
          
         
        // if(status){
        //   console.log(status)
            $('#filteredProducts').load(location.href + " #filteredProducts"); 

        //  $('#filteredProducts').load(location.href + " #filteredProducts");
          
      }
    })
  })



  
    

  