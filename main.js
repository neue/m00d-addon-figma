document.addEventListener("DOMContentLoaded", () => {
  const fetchFrameBtn = document.getElementById("fetchFrame");
  const tokenInput = document.getElementById("tokenInput");
  const shareLinkInput = document.getElementById("shareLinkInput");
  const serverURLInput = document.getElementById("serverURL");
  const dimensionsOutputDiv = document.getElementById("dimensionsOutput");

  const canvas = document.getElementById("tempCanvas");
  const ctx = canvas.getContext("2d");

  let socket = io(serverURLInput.value);

  let currentImage = null; 

  const fetchFrame = (accessToken, fileId, nodeId) => {
    fetch(`https://api.figma.com/v1/images/${fileId}?ids=${encodeURIComponent(nodeId)}`, {
      headers: {
        "X-Figma-Token": `${accessToken}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data && data.images && data.images[nodeId]) {
        const imageUrl = data.images[nodeId];
        
        const newImage = new Image();
        newImage.crossOrigin = "Anonymous";
        newImage.src = imageUrl;
        newImage.addEventListener("load", () => {

          ctx.clearRect(0, 0, canvas.width, canvas.height); 
          ctx.drawImage(newImage, 0, 0, canvas.width, canvas.height);

          currentImage = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const dataURL = canvas.toDataURL();

          socket.emit("newCanvas", dataURL);
          console.log("Here");
          fetchFrameBtn.style.display = "none";
        });
      }
    })
    .catch(error => console.error("Error:", error));
  };


  socket.on('connect', () => {
    console.log("Connected ✅");
    // Eventually this will be changed to type "tool" for scripts like this
    socket.emit('type',"artist");
  });

  socket.on("pushDimensions", (dimensions) => {
    dimensionsOutputDiv.innerHTML = "Dimensions: "+dimensions.w+" x "+dimensions.h;
    canvas.width = dimensions.w;
    canvas.height = dimensions.h;

    if (currentImage) {
      ctx.putImageData(currentImage, 0, 0, 0, 0, dimensions.w, dimensions.h);
    }

    const accessToken = tokenInput.value;
    const shareLink = shareLinkInput.value;
    const url = new URL(shareLink);
    const fileId = url.pathname.split("/")[2];
    const nodeId = url.searchParams.get("node-id");

    if (accessToken && fileId && nodeId) {
      fetchFrame(accessToken, fileId, nodeId);
    }
  });

    fetchFrameBtn.addEventListener("click", () => {
      const accessToken = tokenInput.value;
      const shareLink = shareLinkInput.value;
      const serverURL = serverURLInput.value;
  
      if (socket.io.uri !== serverURL) {
        socket = io(serverURL);

      }
  
      const url = new URL(shareLink);
      const fileId = url.pathname.split('/')[2];
      const nodeId = url.searchParams.get('node-id');
  
      if (accessToken && fileId && nodeId) {
        fetchFrame(accessToken, fileId, nodeId);
  
        setInterval(() => {
          fetchFrame(accessToken, fileId, nodeId);
        }, 5000);
      }
    });
  });
  