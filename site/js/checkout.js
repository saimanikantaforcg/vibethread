// Checkout page behavior for the demo's automatic Face Payment flow.
document.addEventListener("DOMContentLoaded", function() {
  const currentUser = AuthSystem.getCurrentUser();
  if (!currentUser) {
    alert("Please log in to continue to checkout.");
    window.location.href = "login.html";
    return;
  }

  const checkoutEmail = document.getElementById("checkoutEmail");
  if (checkoutEmail) {
    checkoutEmail.textContent = currentUser.email;
  }

  if (cart.getItemCount() === 0) {
    alert("Your cart is empty.");
    window.location.href = "cart.html";
    return;
  }

  var facePayBtn = document.getElementById("facePayBtn");
  if (facePayBtn) {
    facePayBtn.addEventListener("click", function() {
      facePayBtn.disabled = true;
      facePayBtn.textContent = "Processing…";

      var subtotal = cart.getTotal();
      var shipping = subtotal >= 50 ? 0 : 7.99;
      var tax = subtotal * 0.08;
      var total = subtotal + shipping + tax;
      var orderId = "VT-" + Date.now();

      var order = {
        id: orderId,
        date: new Date().toISOString(),
        customer: {
          email: currentUser.email,
          firstName: currentUser.firstName || "",
          lastName: currentUser.lastName || "",
        },
        items: cart.items.map(function(item) {
          var product = ProductUtils.getProductById(item.productId);
          return {
            productId: item.productId,
            quantity: item.quantity,
            size: item.size || null,
            color: item.color || null,
            unitPrice:
              typeof item.unitPrice === "number"
                ? item.unitPrice
                : product
                ? product.price
                : 0,
          };
        }),
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total,
      };

      localStorage.setItem("vibeThreadLastOrder", JSON.stringify(order));

      if (typeof dataLayerManager !== "undefined") {
        dataLayerManager.trackPurchase(order);
      }

      cart.clearCart();

      setTimeout(function() {
        window.location.href =
          "thank-you.html?order=" + encodeURIComponent(orderId);
      }, 800);
    });
  }
});
