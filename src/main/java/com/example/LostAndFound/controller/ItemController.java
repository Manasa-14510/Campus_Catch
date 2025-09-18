// package com.example.LostAndFound.controller;

// import java.time.LocalDateTime;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;
// import java.util.Optional;

// import org.springframework.format.annotation.DateTimeFormat;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.CrossOrigin;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PathVariable;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.PutMapping;
// import org.springframework.web.bind.annotation.RequestBody;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RequestParam;
// import org.springframework.web.bind.annotation.RestController;

// import com.example.LostAndFound.dto.ReportItemRequest;
// import com.example.LostAndFound.entity.Item;
// import com.example.LostAndFound.entity.User;
// import com.example.LostAndFound.repository.ItemRepository;
// import com.example.LostAndFound.service.ItemService;
// import com.example.LostAndFound.service.UserService;

// @RestController
// @RequestMapping("/api/items")
// @CrossOrigin(origins = "*")
// public class ItemController {

//     private final ItemService itemService;
//     private final ItemRepository itemRepository;
//     private final UserService userService;

//     // @Autowired
//     public ItemController(ItemService itemService, ItemRepository itemRepository, UserService userService) {
//         this.itemService = itemService;
//         this.itemRepository = itemRepository;
//         this.userService = userService;
//     }

//     // ------------------- Get items by status -------------------
//     @GetMapping("/lost")
//     public List<Item> getLostItems() {
//         return itemRepository.findByStatus(Item.ItemStatus.LOST);
//     }

//     @GetMapping("/found")
//     public List<Item> getFoundItems() {
//         return itemRepository.findByStatus(Item.ItemStatus.FOUND);
//     }

//     @GetMapping("/claimed")
//     public List<Item> getClaimedItems() {
//         return itemRepository.findByStatus(Item.ItemStatus.CLAIMED);
//     }

//     // ------------------- Search / Filter -------------------
//     @GetMapping("/search")
//     public ResponseEntity<List<Item>> searchItems(
//             @RequestParam(required = false) String itemName,
//             @RequestParam(required = false) String itemType,
//             @RequestParam(required = false) String status,
//                @RequestParam(required = false) String location,
//             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateReported
//     ) {
//         List<Item> items = itemRepository.findAll();

//         if (itemName != null && !itemName.isEmpty()) {
//             items = items.stream()
//                     .filter(item -> item.getItemName() != null &&
//                             item.getItemName().toLowerCase().contains(itemName.toLowerCase()))
//                     .toList();
//         }

//         if (itemType != null && !itemType.isEmpty()) {
//             items = items.stream()
//                     .filter(item -> item.getItemType() != null &&
//                             item.getItemType().toLowerCase().contains(itemType.toLowerCase()))
//                     .toList();
//         }
//          if (location != null && !location.isEmpty()) {
//             items = items.stream()
//                 .filter(item -> item.getLocation() != null &&
//                         item.getLocation().toLowerCase().contains(location.toLowerCase()))
//                 .toList();
//         }

//         if (status != null && !status.isEmpty()) {
//             try {
//                 Item.ItemStatus enumStatus = Item.ItemStatus.valueOf(status.toUpperCase());
//                 items = items.stream()
//                         .filter(item -> item.getStatus() == enumStatus)
//                         .toList();
//             } catch (IllegalArgumentException e) {
//                 return ResponseEntity.badRequest().build();
//             }
//         }

//         if (dateReported != null) {
//             items = items.stream()
//                     .filter(item -> item.getDateReported() != null &&
//                             item.getDateReported().isAfter(dateReported))
//                     .toList();
//         }

//         return ResponseEntity.ok(items);
//     }

//     // ------------------- Get all items -------------------
//     @GetMapping("/all")
//     public List<Item> getAllItems() {
//         return itemRepository.findAll();
//     }

//     // ------------------- Get item by ID -------------------
//     @GetMapping("/{id}")
//     public ResponseEntity<Item> getItemById(@PathVariable String id) {
//         Item item = itemService.getItemById(id);
//         if (item == null) {
//             return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
//         }
//         return ResponseEntity.ok(item);
//     }

//     // ------------------- Claim item -------------------
//     @PutMapping("/{id}/claim")
//     public ResponseEntity<String> claimItem(@PathVariable String id) {
//         boolean success = itemService.claimItem(id);
//         if (success) {
//             return ResponseEntity.ok("Item claimed successfully!");
//         } else {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Item not found or already claimed.");
//         }
//     }
    

//     // ------------------- Report item -------------------
//     @PostMapping("/report")
//     public ResponseEntity<?> reportItem(@RequestBody ReportItemRequest request) {
//         try {
//             // Fetch user by ID (throws RuntimeException if not found)
//             // User currentUser = userService.getUserById(request.getUserId());
//             Optional<User> currentUserOpt = userService.getUserById(request.getUserId());

//             if (currentUserOpt.isEmpty()) {
//                 return ResponseEntity.status(HttpStatus.NOT_FOUND)
//                         .body(Map.of("message", "User not found"));
//             }

//             User currentUser = currentUserOpt.get(); // Now you have the User

//             Item item = new Item();
//             // item.setId(UUID.randomUUID().toString());
//             item.setUserId(currentUser.getUserId()); // Use correct User ID field
             

//             item.setItemName(request.getItemName());
//             item.setItemType(request.getItemType());
//             item.setDescription(request.getDescription());
//             item.setLocation(request.getLocation());

//             // Set status
//             Item.ItemStatus status;
//             if (request.getStatus() == null) {
//                 status = Item.ItemStatus.LOST;
//             } else {
//                 switch (request.getStatus().toLowerCase()) {
//                     case "found" -> status = Item.ItemStatus.FOUND;
//                     case "claimed" -> status = Item.ItemStatus.CLAIMED;
//                     case "returned" -> status = Item.ItemStatus.RETURNED;
//                     default -> status = Item.ItemStatus.LOST;
//                 }
//             }
//             item.setStatus(status);

//             // Set image if exists
//             if (request.getImageBase64() != null && !request.getImageBase64().isEmpty()) {
//                 byte[] imageBytes = ItemService.compressImage(request.getImageBase64(), 600, 600);
//                 item.setItemImage(imageBytes);
//             }

//             Item savedItem = itemService.saveItem(item);

//             Map<String, Object> response = new HashMap<>();
//             response.put("message", "Item reported successfully!");
//             response.put("item", savedItem);
//             return ResponseEntity.ok(response);

//         } catch (Exception e) {
//             Map<String, String> errorMap = new HashMap<>();
//             errorMap.put("message", "Failed to report item: " + e.getMessage());
//             return ResponseEntity.badRequest().body(errorMap);
//         }
//     }
// }
package com.example.LostAndFound.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.LostAndFound.dto.ReportItemRequest;
import com.example.LostAndFound.entity.Item;
import com.example.LostAndFound.entity.User;
import com.example.LostAndFound.repository.ItemRepository;
import com.example.LostAndFound.service.ItemService;
import com.example.LostAndFound.service.UserService;
// ... existing imports and annotations ...

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "*")
public class ItemController {

    private final ItemService itemService;
    private final ItemRepository itemRepository;
    private final UserService userService;

    public ItemController(ItemService itemService, ItemRepository itemRepository, UserService userService) {
        this.itemService = itemService;
        this.itemRepository = itemRepository;
        this.userService = userService;
    }

    @GetMapping("/lost")
    public List<Item> getLostItems() {
        // @JsonProperty on Item#getItemImageBase64 will include the base64 in JSON
        return itemRepository.findByStatus(Item.ItemStatus.LOST);
    }

    @GetMapping("/found")
    public List<Item> getFoundItems() {
        return itemRepository.findByStatus(Item.ItemStatus.FOUND);
    }

    @GetMapping("/claimed")
    public List<Item> getClaimedItems() {
        return itemRepository.findByStatus(Item.ItemStatus.CLAIMED);
    }

    @GetMapping("/all")
    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable String id) {
        return itemRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(null));
    }

    @PostMapping("/report")
    public ResponseEntity<?> reportItem(@RequestBody ReportItemRequest request) {
        try {
            Optional<User> currentUserOpt = userService.getUserById(request.getUserId());
            if (currentUserOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not found"));
            }

            User currentUser = currentUserOpt.get();

            Item item = new Item();
            item.setUserId(currentUser.getUserId());
            item.setItemName(request.getItemName());
            item.setItemType(request.getItemType());
            item.setDescription(request.getDescription());
            item.setLocation(request.getLocation());

            Item.ItemStatus status = Item.ItemStatus.LOST;
            if (request.getStatus() != null) {
                try {
                    status = Item.ItemStatus.valueOf(request.getStatus().toUpperCase());
                } catch (IllegalArgumentException ignored) {}
            }
            item.setStatus(status);

            // Expect a flat base64 string in DTO
            if (request.getImageBase64() != null && !request.getImageBase64().isEmpty()) {
                byte[] imageBytes = ItemService.compressImage(request.getImageBase64(), 600, 600);
                item.setItemImage(imageBytes);
            }

            Item saved = itemRepository.save(item);
            // The response will include itemImageBase64 via @JsonProperty getter
            return ResponseEntity.ok(Map.of("message", "Item reported successfully!", "item", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to report item: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}/claim")
    public ResponseEntity<String> claimItem(@PathVariable String id) {
        boolean success = itemService.claimItem(id);
        return success
                ? ResponseEntity.ok("Item claimed successfully!")
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Item not found or already claimed.");
    }
}