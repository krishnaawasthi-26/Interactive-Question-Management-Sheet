package com.iqms.backend.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "application_submissions")
@CompoundIndexes({
    @CompoundIndex(
        name = "uniq_email_field_month",
        def = "{'normalizedEmail': 1, 'normalizedField': 1, 'applicationMonthKey': 1}",
        unique = true,
        partialFilter = "{ 'applicationStatus': { $in: ['PAID', 'SUBMITTED'] } }"),
    @CompoundIndex(
        name = "uniq_phone_field_month",
        def = "{'normalizedPhone': 1, 'normalizedField': 1, 'applicationMonthKey': 1}",
        unique = true,
        partialFilter = "{ 'applicationStatus': { $in: ['PAID', 'SUBMITTED'] } }")
})
public class ApplicationSubmission {

  @Id
  private String id;

  private String fullName;
  private String email;
  private String phoneNumber;
  private String whatsappNumber;
  private String gender;
  private String college;
  private String fieldApplyingFor;

  private Integer amountPaid;
  private String currency;
  private String paymentStatus;
  private String applicationStatus;
  private String paymentProvider;

  @Indexed(unique = true)
  private String paymentOrderId;

  private String paymentId;
  private String paymentSignature;

  private String normalizedEmail;
  private String normalizedPhone;
  private String normalizedField;
  private String applicationMonthKey;

  private Instant createdAt;
  private Instant updatedAt;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getFullName() {
    return fullName;
  }

  public void setFullName(String fullName) {
    this.fullName = fullName;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPhoneNumber() {
    return phoneNumber;
  }

  public void setPhoneNumber(String phoneNumber) {
    this.phoneNumber = phoneNumber;
  }

  public String getWhatsappNumber() {
    return whatsappNumber;
  }

  public void setWhatsappNumber(String whatsappNumber) {
    this.whatsappNumber = whatsappNumber;
  }

  public String getGender() {
    return gender;
  }

  public void setGender(String gender) {
    this.gender = gender;
  }

  public String getCollege() {
    return college;
  }

  public void setCollege(String college) {
    this.college = college;
  }

  public String getFieldApplyingFor() {
    return fieldApplyingFor;
  }

  public void setFieldApplyingFor(String fieldApplyingFor) {
    this.fieldApplyingFor = fieldApplyingFor;
  }

  public Integer getAmountPaid() {
    return amountPaid;
  }

  public void setAmountPaid(Integer amountPaid) {
    this.amountPaid = amountPaid;
  }

  public String getCurrency() {
    return currency;
  }

  public void setCurrency(String currency) {
    this.currency = currency;
  }

  public String getPaymentStatus() {
    return paymentStatus;
  }

  public void setPaymentStatus(String paymentStatus) {
    this.paymentStatus = paymentStatus;
  }

  public String getApplicationStatus() {
    return applicationStatus;
  }

  public void setApplicationStatus(String applicationStatus) {
    this.applicationStatus = applicationStatus;
  }

  public String getPaymentProvider() {
    return paymentProvider;
  }

  public void setPaymentProvider(String paymentProvider) {
    this.paymentProvider = paymentProvider;
  }

  public String getPaymentOrderId() {
    return paymentOrderId;
  }

  public void setPaymentOrderId(String paymentOrderId) {
    this.paymentOrderId = paymentOrderId;
  }

  public String getPaymentId() {
    return paymentId;
  }

  public void setPaymentId(String paymentId) {
    this.paymentId = paymentId;
  }

  public String getPaymentSignature() {
    return paymentSignature;
  }

  public void setPaymentSignature(String paymentSignature) {
    this.paymentSignature = paymentSignature;
  }

  public String getNormalizedEmail() {
    return normalizedEmail;
  }

  public void setNormalizedEmail(String normalizedEmail) {
    this.normalizedEmail = normalizedEmail;
  }

  public String getNormalizedPhone() {
    return normalizedPhone;
  }

  public void setNormalizedPhone(String normalizedPhone) {
    this.normalizedPhone = normalizedPhone;
  }

  public String getNormalizedField() {
    return normalizedField;
  }

  public void setNormalizedField(String normalizedField) {
    this.normalizedField = normalizedField;
  }

  public String getApplicationMonthKey() {
    return applicationMonthKey;
  }

  public void setApplicationMonthKey(String applicationMonthKey) {
    this.applicationMonthKey = applicationMonthKey;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
