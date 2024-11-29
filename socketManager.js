const jwt = require("jsonwebtoken");
const Auction = require("./models/Auction"); // Update this path as per your project structure

let auctionTimer = 30;
let auctionInterval = null; // Timer interval
let currentBid = 0;
let highestBidder = null;

// Start the auction timer
const startAuctionTimer = async (io, auctionId) => {
  if (auctionInterval) clearInterval(auctionInterval);

  const auction = await Auction.findById(auctionId);
  if (!auction) return;

  auctionInterval = setInterval(async () => {
    if (auctionTimer > 0) {
      auctionTimer -= 1;
      io.emit("update", {
        currentBid,
        highestBidder,
        timer: auctionTimer,
        auctionId: auctionId,
      });
    } else {
      clearInterval(auctionInterval);
      const buyNowTimerLeft = new Date(Date.now() + 10 * 60 * 1000); // Add 10 minutes

      const updatedAuction = await Auction.findByIdAndUpdate(
        auctionId,
        {
          isActive: false,
          isBuyNowLive: true,
          buyNowTimerLeft,
        },
        { new: true }
      );

      io.emit("auctionEnd", {
        winner: updatedAuction.highestBidder,
        currentBid,
        auctionId: auctionId,
      });

      auctionTimer = 30; // Reset the timer
    }
  }, 1000);
};

// Socket.IO event handlers
const socketManager = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Handle bid event
    socket.on("bid", async ({ auctionId2, bidAmount, token }) => {
      try {
        const decoded = jwt.verify(token, "secret");
        const auction = await Auction.findOne({
          isActive: true,
          isSold: false,
          _id: auctionId2,
        });

        if (!auction) {
          socket.emit("error", "No active auction found.");
          return;
        }

        if (bidAmount > auction.currentBid) {
          auction.currentBid = bidAmount;
          auction.highestBidder = decoded.email;
          auction.timer = 30;
          await auction.save();

          currentBid = auction.currentBid;
          highestBidder = auction.highestBidder;

          io.emit("update", {
            currentBid: auction.currentBid,
            highestBidder: auction.highestBidder,
            timer: auction.timer,
            auctionId: auction._id,
          });

          startAuctionTimer(io, auction._id);
        } else {
          socket.emit("error", "Bid must be higher than the current bid.");
        }
      } catch (error) {
        console.error("Error handling bid event:", error);
        socket.emit("error", "An error occurred while placing the bid.");
      }
    });

    // Handle auction reactivation
    socket.on("buyNowExpired", async ({ auctionId }) => {
      try {
        const auction = await Auction.findByIdAndUpdate(
          auctionId,
          {
            isActive: true,
            isBuyNowLive: false,
            buyNowTimerLeft: null,
            highestBidder: "",
          },
          { new: true }
        );

        if (auction) {
          io.emit("auctionReactivated", { auctionId });
        }
      } catch (error) {
        console.error("Error reactivating auction:", error);
      }
    });

    // Handle auction update
    socket.on("updateAuction", async (auctionId2) => {
      try {
        const auction = await Auction.findByIdAndUpdate(
          auctionId2,
          { isSold: true, isActive: false, soldAt: new Date() },
          { new: true }
        );

        if (auction) {
          io.emit("auctionReactivated", { auctionId2 });
        }
      } catch (error) {
        console.error("Error updating auction:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

module.exports = socketManager;
