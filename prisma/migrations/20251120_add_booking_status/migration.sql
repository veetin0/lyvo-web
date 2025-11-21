-- Add status column to bookings table
ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'pending' NOT NULL;

-- Add check constraint to ensure valid status values
ALTER TABLE bookings ADD CONSTRAINT valid_booking_status 
  CHECK (status IN ('pending', 'accepted', 'rejected'));
