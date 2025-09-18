package com.example.LostAndFound.service;

import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;

import com.example.LostAndFound.dto.DashboardResponse;
import com.example.LostAndFound.dto.ItemDto;
import com.example.LostAndFound.entity.Item;
import com.example.LostAndFound.entity.User;
import com.example.LostAndFound.repository.ItemRepository;

@Service
public class ItemService {
    private final ItemRepository itemRepository;
    private final UserService userService;
    private final NotificationService notificationService; // ✅ Inject NotificationService

    // Constructor injection
    public ItemService(ItemRepository itemRepository,
                       UserService userService,
                       NotificationService notificationService) {
        this.itemRepository = itemRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    // ------------------- Get item by ID -------------------
    public Item getItemById(String id) {
        Optional<Item> itemOpt = itemRepository.findById(id);
        return itemOpt.orElse(null); // Return null if not found
    }

    // ------------------- Save item -------------------
    public Item saveItem(Item item) {
        if (item.getId() == null || item.getId().trim().isEmpty()) {
            item.setId(null); // Let MongoDB generate _id
        }

        // Save item first
        Item savedItem = itemRepository.save(item);

        // ✅ If it's a FOUND item, check for matching LOST items and notify owners
        if (savedItem.getStatus() == Item.ItemStatus.FOUND) {
            notifyLostItemOwners(savedItem);
        }

        return savedItem;
    }

    // ------------------- Notify lost item owners -------------------
    private void notifyLostItemOwners(Item foundItem) {
        // Find lost items with same type/name (you can enhance matching logic)
        List<Item> lostItems = itemRepository.findByItemNameIgnoreCase(foundItem.getItemName());

        for (Item lostItem : lostItems) {
            if (lostItem.getStatus() == Item.ItemStatus.LOST) {
                Optional<User> userOpt = userService.getUserById(lostItem.getUserId());
                if (userOpt.isPresent()) {
                    User lostOwner = userOpt.get();
                    String subject = "A similar item has been found!";
                    String body = "Hi " + lostOwner.getFirstName() + ",\n\n"
                            + "We noticed that you reported a lost item: " + lostItem.getItemName() + ".\n"
                            + "Good news! A similar item was just reported as FOUND.\n\n"
                            + "Item details:\n"
                            + "- Name: " + foundItem.getItemName() + "\n"
                            + "- Type: " + foundItem.getItemType() + "\n"
                            + "- Reported on: " + foundItem.getDateReported() + "\n\n"
                            + "Please log in to the Lost & Found portal to check it out.\n\n"
                            + "Best regards,\nLost & Found Team";

                    // Send email
                    notificationService.sendEmail(lostOwner.getEmail(), subject, body);
                }
            }
        }
    }

    // ------------------- Claim item -------------------
    public boolean claimItem(String id) {
        Optional<Item> itemOpt = itemRepository.findById(id);
        if (itemOpt.isPresent()) {
            Item item = itemOpt.get();
            if (item.getStatus() != Item.ItemStatus.CLAIMED) {
                item.setStatus(Item.ItemStatus.CLAIMED);
                itemRepository.save(item);
                return true;
            }
        }
        return false;
    }

    // ------------------- Image compression utility -------------------
    public static byte[] compressImage(String base64Image, int width, int height) throws Exception {
        byte[] imageBytes = Base64.getDecoder().decode(base64Image);
        BufferedImage originalImage = ImageIO.read(new java.io.ByteArrayInputStream(imageBytes));

        BufferedImage resizedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resizedImage.createGraphics();
        g.drawImage(originalImage, 0, 0, width, height, null);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(resizedImage, "jpg", baos);
        return baos.toByteArray();
    }

    // ------------------- Dashboard Data -------------------
    public DashboardResponse getDashboardData(String userId) {
        DashboardResponse response = new DashboardResponse();

        long lostCount = itemRepository.countByUserIdAndStatus(userId, Item.ItemStatus.LOST);
        long foundCount = itemRepository.countByUserIdAndStatus(userId, Item.ItemStatus.FOUND);
        long claimedCount = itemRepository.countByUserIdAndStatus(userId, Item.ItemStatus.CLAIMED);

        response.setLostCount(lostCount);
        response.setFoundCount(foundCount);
        response.setClaimedCount(claimedCount);

        List<Item> recentItemsList = itemRepository.findTop5ByUserIdOrderByDateReportedDesc(userId);

        List<ItemDto> recentItemsDto = recentItemsList.stream()
                .map(item -> new ItemDto(
                        item.getId(),
                        item.getItemName(),
                        item.getItemType() != null ? item.getItemType() : "",
                        item.getDateReported() != null ? item.getDateReported().toString() : "",
                        item.getStatus() != null ? item.getStatus().name() : ""
                ))
                .collect(Collectors.toList());

        response.setRecentItems(recentItemsDto);

        String fullName = "Unknown User";
        if (!recentItemsList.isEmpty()) {
            String reporterId = recentItemsList.get(0).getUserId();
            Optional<User> userOpt = userService.getUserById(reporterId);
            if (userOpt.isPresent()) {
                fullName = userOpt.get().getFirstName() + " " + userOpt.get().getLastName();
            }
        }
        response.setFullName(fullName);

        return response;
    }
}
