-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MUNICIPALITIES
CREATE TABLE IF NOT EXISTS municipalities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    featured_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1b. MUNICIPALITY IMAGES (Multiple images for municipality details banner)
CREATE TABLE IF NOT EXISTS municipality_images (
    id SERIAL PRIMARY KEY,
    municipality_id INT REFERENCES municipalities(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USER ACCOUNTS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('PROVINCIAL_DOT', 'MUNICIPAL_DOT', 'HOMESTAY_OWNER', 'TOUR_GUIDE', 'TOURIST');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE account_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM ('PENDING', 'ENDORSED', 'APPROVED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_status') THEN
        CREATE TYPE inquiry_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'RESPONDED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
        CREATE TYPE activity_type AS ENUM ('ATTRACTION', 'HOMESTAY', 'GUIDE', 'CUSTOM');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'requirement_target') THEN
        CREATE TYPE requirement_target AS ENUM ('HOMESTAY', 'TOUR_GUIDE');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    municipality_id INT REFERENCES municipalities(id) ON DELETE SET NULL,
    status account_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. MUNICIPAL DOT PROFILES (Extends User Account)
CREATE TABLE IF NOT EXISTS municipal_dot_profiles (
    user_id UUID PRIMARY KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
    designation VARCHAR(150),
    office_address TEXT,
    profile_picture_url TEXT,
    authorized_at TIMESTAMP WITH TIME ZONE,
    authorized_by UUID REFERENCES user_accounts(id)
);

-- 4. HOMESTAY PROFILES
CREATE TABLE IF NOT EXISTS homestay_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID UNIQUE REFERENCES user_accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    status account_status DEFAULT 'PENDING',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. HOMESTAY IMAGES
CREATE TABLE IF NOT EXISTS homestay_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homestay_id UUID REFERENCES homestay_profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. HOMESTAY ROOMS
CREATE TABLE IF NOT EXISTS homestay_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homestay_id UUID REFERENCES homestay_profiles(id) ON DELETE CASCADE,
    room_type VARCHAR(100) NOT NULL,
    price_per_night DECIMAL(10, 2) NOT NULL,
    capacity INT NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TOUR GUIDE PROFILES
CREATE TABLE IF NOT EXISTS tour_guide_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guide_id UUID UNIQUE REFERENCES user_accounts(id) ON DELETE CASCADE,
    profile_picture_url TEXT,
    bio TEXT,
    languages_spoken VARCHAR(255),
    services_offered TEXT,
    areas_covered TEXT,
    price_rate DECIMAL(10, 2),
    status account_status DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. TOURIST ATTRACTIONS
CREATE TABLE IF NOT EXISTS tourist_attractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id INT REFERENCES municipalities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image_url TEXT,
    location_details TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. MUNICIPAL REQUIREMENTS CONFIGURATION
CREATE TABLE IF NOT EXISTS municipal_requirements (
    id SERIAL PRIMARY KEY,
    municipality_id INT REFERENCES municipalities(id) ON DELETE CASCADE,
    target_type requirement_target NOT NULL,
    requirement_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. SUBMITTED DOCUMENTS FOR ACCREDITATION
CREATE TABLE IF NOT EXISTS submitted_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    requirement_id INT REFERENCES municipal_requirements(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    status document_status DEFAULT 'PENDING',
    review_comments TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES user_accounts(id)
);

-- 11. BOOKINGS AND INQUIRIES
CREATE TABLE IF NOT EXISTS bookings_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    homestay_id UUID REFERENCES homestay_profiles(id) ON DELETE SET NULL,
    guide_id UUID REFERENCES tour_guide_profiles(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    number_of_guests INT,
    message TEXT NOT NULL,
    status inquiry_status DEFAULT 'PENDING',
    reply_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. ITINERARIES
CREATE TABLE IF NOT EXISTS itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tourist_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. ITINERARY ITEMS
CREATE TABLE IF NOT EXISTS itinerary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    time_slot TIME,
    activity_type activity_type NOT NULL,
    attraction_id UUID REFERENCES tourist_attractions(id) ON DELETE SET NULL,
    homestay_id UUID REFERENCES homestay_profiles(id) ON DELETE SET NULL,
    guide_id UUID REFERENCES tour_guide_profiles(id) ON DELETE SET NULL,
    custom_activity_name VARCHAR(255),
    notes TEXT,
    sequence_order INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. APPROVAL LOGS
CREATE TABLE IF NOT EXISTS approval_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    action_by UUID REFERENCES user_accounts(id),
    previous_status account_status,
    new_status account_status NOT NULL,
    remarks TEXT,
    actioned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. MUNICIPAL TOUR PACKAGES
CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality_id INT REFERENCES municipalities(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duration_days INT DEFAULT 1,
    image_url TEXT,
    inclusions TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. PACKAGE ITEMS (Day-by-day activities inside a package)
CREATE TABLE IF NOT EXISTS package_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    time_slot TIME,
    activity_type activity_type NOT NULL,
    attraction_id UUID REFERENCES tourist_attractions(id) ON DELETE SET NULL,
    homestay_id UUID REFERENCES homestay_profiles(id) ON DELETE SET NULL,
    guide_id UUID REFERENCES tour_guide_profiles(id) ON DELETE SET NULL,
    custom_activity_name VARCHAR(255),
    notes TEXT,
    sequence_order INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

