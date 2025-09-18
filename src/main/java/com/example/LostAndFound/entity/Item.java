// package com.example.LostAndFound.entity;

// import java.time.LocalDateTime;
// import java.util.Base64;

// import org.springframework.data.annotation.Id;
// import org.springframework.data.mongodb.core.mapping.Document;

// import jakarta.persistence.Lob;
// import jakarta.persistence.Transient;
// import lombok.AllArgsConstructor;
// import lombok.Getter;
// import lombok.NoArgsConstructor;
// import lombok.Setter;
// @Document(collection = "items")
// @Getter
// @Setter
// @NoArgsConstructor
// @AllArgsConstructor
// public class Item {

//     @Id
    
//     private String id;
        
//     // private String id = UUID.randomUUID().toString();


//     private String userId; // reference to User.id
//     private String itemName;
//     private String itemType;
//     private String description;
//     private String location;
//     private ItemStatus status = ItemStatus.LOST;
//     private LocalDateTime dateReported = LocalDateTime.now();
   
//     private byte[] itemImage;
    
//     public enum ItemStatus { LOST, FOUND, CLAIMED, RETURNED }
// }
package com.example.LostAndFound.entity;

import java.time.LocalDateTime;
import java.util.Base64;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Item {

    @Id
    private String id;

    private String userId;
    private String itemName;
    private String itemType;
    private String description;
    private String location;
    private String userEmail;   // who reported
    private String imageUrl; 
    private ItemStatus status = ItemStatus.LOST;
    private LocalDateTime dateReported = LocalDateTime.now();

    @JsonIgnore // ✅ Tell the serializer to ignore this field
    private byte[] itemImage;

    public enum ItemStatus { LOST, FOUND, CLAIMED, RETURNED }

    @JsonProperty("itemImageBase64") // ✅ Tell the serializer to use this method
    public String getItemImageBase64() {
        if (itemImage != null) {
            return Base64.getEncoder().encodeToString(itemImage);
        }
        return null;
    }

    public void setItemImageBase64(String base64Image) {
        if (base64Image != null) {
            this.itemImage = Base64.getDecoder().decode(base64Image);
        }
    }
}