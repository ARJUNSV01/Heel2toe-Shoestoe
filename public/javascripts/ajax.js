function deleteItem(cartId) {
  $.ajax({
    url: "/cart/delete/" + cartId,
    method: "get",
    success(response) {
      if (response.deleted) {
        $("#cart_area").load(location.href + " #cart_area");
      }
    },
  });
}
function deleteAll() {
  $.ajax({
    url: "/clearCart",
    method: "get",
    success(response) {
      if (response.deleted) {
        $("#cart_area").load(location.href + " #cart_area");
      }
    },
  });
}
function addCount(cartId) {
  $.ajax({
    url: "/addcount/" + cartId,
    method: "get",
    success(response) {
      if (response.added) {
        $("#cart_area").load(location.href + " #cart_area");
      }
    },
  });
}
function subCount(cartId) {
  $.ajax({
    url: "/subcount/" + cartId,
    method: "get",
    success(response) {
      if (response.sub) {
        $("#cart_area").load(location.href + " #cart_area");
      }
    },
  });
}

$("input[name=brandName]").change(() => {
  $.ajax({
    url: "/products/filter",
    method: "post",
    data: $("#brandFilter").serialize(),
    success: (status) => {
      $("#filteredProducts").load(location.href + " #filteredProducts");
    },
  });
});
$("input[name=category]").change(() => {
  $.ajax({
    url: "/products/filter",
    method: "post",
    data: $("#brandFilter").serialize(),
    success: (status) => {
      $("#filteredProducts").load(location.href + " #filteredProducts");

    },
  });
});


$("#sortMenu").on("change", () => {
  $.ajax({
    url: "/products/filter",
    method: "post",
    data: $("#brandFilter").serialize(),
    success: (status) => {
      
      $("#filteredProducts").load(location.href + " #filteredProducts");

    },
  });
});

function cancelOrder(orderId, cartId, productId, size, quantity) {
 
  $.ajax({
    url: "/cancelOrder",
    method: "get",
    data: { orderId, cartId, productId, size, quantity },
    success() {
      $("#order-list").load(location.href + " #order-list");
    },
  });
}
$("#submitReviews").submit((e) => {
  e.preventDefault();
  $.ajax({
    url: "/submit-reviews",
    method: "post",
    data: $("#submitReviews").serialize(),
    success: (status) => {
      if (status) {
        
        $("#submitReviews").load(location.href + " #submitReviews");
      }
    },
  });
});
$("input[name=SbrandName]").change(() => {
  $.ajax({
    url: "/products/search",
    method: "post",
    data: $("#searchAndFilter").serialize(),
    success: (status) => {
    
      $("#filteredProducts").load(location.href + " #filteredProducts");

    
    },
  });
});
$("input[name=Scategory]").change(() => {
  $.ajax({
    url: "/products/search",
    method: "post",
    data: $("#searchAndFilter").serialize(),
    success: (status) => {

      $("#filteredProducts").load(location.href + " #filteredProducts");

     
    },
  });
});

$("#sortMenu").on("change", () => {
  $.ajax({
    url: "/products/search",
    method: "post",
    data: $("#searchAndFilter").serialize(),
    success: (status) => {
   
      $("#filteredProducts").load(location.href + " #filteredProducts");

    },
  });
});
