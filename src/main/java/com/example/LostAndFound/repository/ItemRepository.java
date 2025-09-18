package com.example.LostAndFound.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.LostAndFound.entity.Item;
import com.example.LostAndFound.entity.Item.ItemStatus;

@Repository
public interface ItemRepository extends MongoRepository<Item, String> {

    // Find items by status
    List<Item> findByStatus(ItemStatus status);

    // Find top 5 items by userId ordered by dateReported descending
    List<Item> findTop5ByUserIdOrderByDateReportedDesc(String userId);

    // Count items by userId and status
    long countByUserIdAndStatus(String userId, ItemStatus status);

    // Find items containing search query in name or description
    List<Item> findByItemNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String itemName, String description);

    // Find items by itemType and status
    List<Item> findByItemTypeContainingIgnoreCaseAndStatus(String itemType, ItemStatus status);

    // Find items by itemType only
    List<Item> findByItemTypeContainingIgnoreCase(String itemType);

    // Find items by itemName only
    List<Item> findByItemNameContainingIgnoreCase(String itemName);

    // Find items reported after a specific date
    List<Item> findByDateReportedAfter(LocalDateTime dateReported);

    // Custom query using enum properly
    @Query("{ 'status': ?0 }")
    List<Item> findItemsByStatus(ItemStatus status);
     List<Item> findByItemNameIgnoreCase(String itemName);
    List<Item> findByCategoryAndLocationAndStatus(String category, String location, String status);

    /**
     * Example aggregation: fetch items with username from User collection
     * You need MongoTemplate or @Aggregation in Spring Data MongoDB for this:
     *
     * @Aggregation(pipeline = {
     *     "{ $match: { status: ?0 } }",
     *     "{ $lookup: { from: 'users', localField: 'userId', foreignField: 'id', as: 'userInfo' } }",
     *     "{ $unwind: '$userInfo' }",
     *     "{ $project: { itemName: 1, itemType: 1, description: 1, location: 1, dateReported: 1, status: 1, username: '$userInfo.username' } }"
     * })
     * List<ItemWithUsername> findItemsWithUsernameByStatus(ItemStatus status);
     *
     * Note: You would need a DTO interface or class like:
     * public interface ItemWithUsername {
     *     String getItemName();
     *     String getItemType();
     *     String getDescription();
     *     String getLocation();
     *     LocalDateTime getDateReported();
     *     ItemStatus getStatus();
     *     String getUsername();
     * }
     */
}
