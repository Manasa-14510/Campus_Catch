package com.example.LostAndFound.dto;

public class PasswordChangeRequest {
    private String currentPassword;
    private String newPassword;

    // No-args constructor
    public PasswordChangeRequest() {}

    // All-args constructor
    public PasswordChangeRequest(String currentPassword, String newPassword) {
        this.currentPassword = currentPassword;
        this.newPassword = newPassword;
    }

    // Getters and Setters
    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }

    @Override
    public String toString() {
        return "PasswordChangeRequest{currentPassword='" + currentPassword + 
               "', newPassword='" + newPassword + "'}";
    }
}


