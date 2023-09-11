document.addEventListener("DOMContentLoaded", () => {
    const fetchFrameBtn = document.getElementById("fetchFrame");
    const frameImage = document.getElementById("frameImage");
    const tokenInput = document.getElementById("tokenInput");
    const shareLinkInput = document.getElementById("shareLinkInput");
    const serverURLInput = document.getElementById("serverURL");
  
    let socket = io(serverURLInput.value);
  
    const fetchFrame = (accessToken, fileId, nodeId) => {
        fetch(`https://api.figma.com/v1/images/${fileId}?ids=${encodeURIComponent(nodeId)}`, {
          headers: {
            'X-Figma-Token': `${accessToken}`
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data && data.images && data.images[nodeId]) {
            const imageUrl = data.images[nodeId];
            
            const newImage = new Image();
            newImage.crossOrigin = "Anonymous"; // This is necessary for CORS when drawing an image to canvas
            newImage.src = imageUrl;
            newImage.addEventListener('load', () => {
              frameImage.src = imageUrl;
      
              const canvas = document.getElementById('tempCanvas');
              const ctx = canvas.getContext('2d');
      
              canvas.width = newImage.width;
              canvas.height = newImage.height;
      
              ctx.drawImage(newImage, 0, 0);
      
              const dataURL = canvas.toDataURL();
      
              socket.emit('newCanvas', dataURL);
            });
          }
        })
        .catch(error => console.error('Error:', error));
      };
      
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
  