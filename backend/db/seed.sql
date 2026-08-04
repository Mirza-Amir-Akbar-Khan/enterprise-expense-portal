-- Seed data for app_db

USE app_db;

-- 1. Insert Roles
INSERT INTO roles (id, name) VALUES
    (1, 'PENDING'),
    (2, 'EMPLOYEE'),
    (3, 'MANAGER'),
    (4, 'ADMIN')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Categories
INSERT INTO categories (id, name) VALUES
    (1, 'Travel'),
    (2, 'Meals'),
    (3, 'Software'),
    (4, 'Hardware'),
    (5, 'Other')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Insert Statuses
INSERT INTO statuses (id, name) VALUES
    (1, 'Pending'),
    (2, 'Approved'),
    (3, 'Rejected')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Insert Users (Admin, 3 Senior Managers, 7 Line Managers, 20 Employees)

-- Level 1: System Admin / CEO (Top Level: manager_id = NULL)
INSERT INTO users (id, cognito_sub, name, email, role_id, manager_id) VALUES
    (1, 'sub-admin-001', 'System Admin', 'admin@company.com', 4, NULL)
ON DUPLICATE KEY UPDATE cognito_sub=VALUES(cognito_sub), name=VALUES(name), role_id=VALUES(role_id), manager_id=VALUES(manager_id);

-- Level 2: 3 Senior Managers (Managers of Managers, reporting to CEO id=1)
INSERT INTO users (id, cognito_sub, name, email, role_id, manager_id) VALUES
    (2, 'sub-senior-002', 'Sarah Jenkins', 'sarah.jenkins@company.com', 3, 1), -- VP of Engineering
    (3, 'sub-senior-003', 'Michael Chen', 'michael.chen@company.com', 3, 1),   -- VP of Sales & Ops
    (4, 'sub-senior-004', 'Amanda Ross', 'amanda.ross@company.com', 3, 1)     -- VP of Product & Finance
ON DUPLICATE KEY UPDATE cognito_sub=VALUES(cognito_sub), name=VALUES(name), role_id=VALUES(role_id), manager_id=VALUES(manager_id);

-- Level 3: 7 Line Managers (reporting to Senior Managers id=2, 3, 4)
INSERT INTO users (id, cognito_sub, name, email, role_id, manager_id) VALUES
    -- Engineering Line Managers (reporting to Sarah Jenkins id=2)
    (5, 'sub-mgr-005', 'David Miller', 'david.miller@company.com', 3, 2),     -- Frontend Engineering Mgr
    (6, 'sub-mgr-006', 'Jessica Taylor', 'jessica.taylor@company.com', 3, 2), -- Backend Engineering Mgr
    (7, 'sub-mgr-007', 'Robert Wilson', 'robert.wilson@company.com', 3, 2),   -- DevOps & Infra Mgr

    -- Sales Line Managers (reporting to Michael Chen id=3)
    (8, 'sub-mgr-008', 'Emily Davis', 'emily.davis@company.com', 3, 3),       -- Sales Mgr (East Coast)
    (9, 'sub-mgr-009', 'James Anderson', 'james.anderson@company.com', 3, 3),  -- Sales Mgr (West Coast)

    -- Product & Finance Line Managers (reporting to Amanda Ross id=4)
    (10, 'sub-mgr-010', 'Laura Martinez', 'laura.martinez@company.com', 3, 4),-- Product Design Mgr
    (11, 'sub-mgr-011', 'Daniel Thomas', 'daniel.thomas@company.com', 3, 4)   -- Finance & Accounting Mgr
ON DUPLICATE KEY UPDATE cognito_sub=VALUES(cognito_sub), name=VALUES(name), role_id=VALUES(role_id), manager_id=VALUES(manager_id);

-- Level 4: 20 Employees (reporting to Line Managers id=5..11)
INSERT INTO users (id, cognito_sub, name, email, role_id, manager_id) VALUES
    -- Frontend Team (reporting to David Miller id=5)
    (12, 'sub-emp-012', 'Alex Johnson', 'alex.johnson@company.com', 2, 5),
    (13, 'sub-emp-013', 'Alice Smith', 'alice@company.com', 2, 5),
    (14, 'sub-emp-014', 'Brian Lee', 'brian.lee@company.com', 2, 5),
    (15, 'sub-emp-015', 'Catherine Wright', 'catherine.wright@company.com', 2, 5),

    -- Backend Team (reporting to Jessica Taylor id=6)
    (16, 'sub-emp-016', 'Daniel Kim', 'daniel.kim@company.com', 2, 6),
    (17, 'sub-emp-017', 'Elena Rostova', 'elena.rostova@company.com', 2, 6),
    (18, 'sub-emp-018', 'Frank Garcia', 'frank.garcia@company.com', 2, 6),

    -- DevOps & Cloud Team (reporting to Robert Wilson id=7)
    (19, 'sub-emp-019', 'Grace Hopper', 'grace.hopper@company.com', 2, 7),
    (20, 'sub-emp-020', 'Henry Ford', 'henry.ford@company.com', 2, 7),
    (21, 'sub-emp-021', 'Isabel Torres', 'isabel.torres@company.com', 2, 7),

    -- East Coast Sales Team (reporting to Emily Davis id=8)
    (22, 'sub-emp-022', 'Jack Ryan', 'jack.ryan@company.com', 2, 8),
    (23, 'sub-emp-023', 'Karen Gillan', 'karen.gillan@company.com', 2, 8),
    (24, 'sub-emp-024', 'Liam Neeson', 'liam.neeson@company.com', 2, 8),

    -- West Coast Sales Team (reporting to James Anderson id=9)
    (25, 'sub-emp-025', 'Maya Lin', 'maya.lin@company.com', 2, 9),
    (26, 'sub-emp-026', 'Nathan Drake', 'nathan.drake@company.com', 2, 9),
    (27, 'sub-emp-027', 'Olivia Wilde', 'olivia.wilde@company.com', 2, 9),

    -- Product Design Team (reporting to Laura Martinez id=10)
    (28, 'sub-emp-028', 'Peter Parker', 'peter.parker@company.com', 2, 10),
    (29, 'sub-emp-029', 'Quinn Fabray', 'quinn.fabray@company.com', 2, 10),
    (30, 'sub-emp-030', 'Rachel Green', 'rachel.green@company.com', 2, 10),

    -- Finance Team (reporting to Daniel Thomas id=11)
    (31, 'sub-emp-031', 'Sam Winchester', 'sam.winchester@company.com', 2, 11)
ON DUPLICATE KEY UPDATE cognito_sub=VALUES(cognito_sub), name=VALUES(name), role_id=VALUES(role_id), manager_id=VALUES(manager_id);


-- 5. Insert Sample Claims

INSERT INTO claims (id, user_id, title, description, category_id, total_amount, claim_date, status_id, reviewed_by) VALUES
    -- Claims for Alice Smith (user_id=13, manager=David Miller id=5)
    (1, 13, 'Annual IDE & Dev Licenses', 'JetBrains and Copilot annual subscriptions', 3, 299.00, '2026-07-28', 1, NULL),
    (2, 13, 'New York Developer Conference', 'Flight, hotel, and registration fee for NY Tech Summit', 1, 1150.00, '2026-07-15', 2, 5),
    (3, 13, 'Client Onboarding Dinner', 'Team dinner with strategic partner representatives', 2, 145.00, '2026-07-20', 3, 5),

    -- Claims for Alex Johnson (user_id=12, manager=David Miller id=5)
    (4, 12, 'Ergonomic Chair & Monitor Arm', 'Workplace ergonomics setup for remote workstation', 4, 420.00, '2026-07-10', 2, 5),
    (5, 12, 'React Rally Ticket & Flight', 'Conference ticket and travel expenses to Salt Lake City', 1, 850.00, '2026-08-01', 1, NULL),

    -- Claims for Daniel Kim (user_id=16, manager=Jessica Taylor id=6)
    (6, 16, 'AWS Certified Solutions Architect Exam', 'Certification exam voucher fee', 5, 300.00, '2026-07-22', 2, 6),
    (7, 16, 'Server Hardware Upgrade', 'High performance RAM kits for local test bench', 4, 550.00, '2026-07-29', 1, NULL),

    -- Claims for Grace Hopper (user_id=19, manager=Robert Wilson id=7)
    (8, 19, 'KubeCon Chicago Registration & Hotel', 'KubeCon conference pass and hotel stay', 1, 1400.00, '2026-07-18', 2, 7),

    -- Claims for Jack Ryan (user_id=22, manager=Emily Davis id=8)
    (9, 22, 'Enterprise Client Hospitality', 'Dinner with key prospects at Manhattan Steakhouse', 2, 380.00, '2026-07-25', 2, 8),
    (10, 22, 'Boston Client Onsite Visit', 'Amtrak train ticket and Uber rides in Boston', 1, 260.00, '2026-08-02', 1, NULL),

    -- Claims for Maya Lin (user_id=25, manager=James Anderson id=9)
    (11, 25, 'SF Tech Expo Booth Sponsorship', 'Regional marketing event booth reservation deposit', 5, 2000.00, '2026-07-12', 2, 9),

    -- Claims for Peter Parker (user_id=28, manager=Laura Martinez id=10)
    (12, 28, 'Figma Enterprise License', 'Prototyping software annual plan', 3, 180.00, '2026-07-05', 2, 10),
    (13, 28, 'User Testing Panel Incentives', 'Gift cards for 10 research study participants', 5, 250.00, '2026-07-30', 1, NULL),

    -- Claims for Sam Winchester (user_id=31, manager=Daniel Thomas id=11)
    (14, 31, 'CPA Annual Membership Dues', 'Professional accounting association dues', 5, 400.00, '2026-07-14', 2, 11),

    -- Claim for Line Manager David Miller (user_id=5, manager=Sarah Jenkins id=2)
    (15, 5, 'Frontend Team Building Lunch', 'Quarterly celebration lunch for 5 engineers', 2, 210.00, '2026-07-27', 2, 2)
ON DUPLICATE KEY UPDATE title=VALUES(title), total_amount=VALUES(total_amount), status_id=VALUES(status_id);


-- 6. Insert Sample Claim Items

INSERT INTO claim_items (id, claim_id, item_name, category_id, amount, item_date, notes, s3_object_key) VALUES
    -- Items for Claim #1
    (1, 1, 'JetBrains All Products Pack', 3, 199.00, '2026-07-28', 'Annual IDE subscription receipt', 'receipts/2026/07/jetbrains_invoice.pdf'),
    (2, 1, 'GitHub Copilot Business', 3, 100.00, '2026-07-28', 'AI assistant subscription', 'receipts/2026/07/copilot_receipt.pdf'),

    -- Items for Claim #2
    (3, 2, 'Delta Flight JFK - ORD', 1, 550.00, '2026-07-14', 'Roundtrip flight ticket', 'receipts/2026/07/delta_flight.pdf'),
    (4, 2, 'Hilton Chicago Downtown Stay', 1, 450.00, '2026-07-15', '2 nights lodging', 'receipts/2026/07/hilton_hotel.png'),
    (5, 2, 'Airport Express Taxi', 1, 150.00, '2026-07-15', 'Taxi fare to venue', NULL),

    -- Items for Claim #3
    (6, 3, 'Steakhouse Dinner with Partners', 2, 145.00, '2026-07-20', 'Itemized dinner bill', 'receipts/2026/07/steakhouse_receipt.jpg'),

    -- Items for Claim #4
    (7, 4, 'Herman Miller Office Chair', 4, 320.00, '2026-07-10', 'Refurbished ergonomic chair', 'receipts/2026/07/chair_invoice.pdf'),
    (8, 4, 'Dual Monitor Arm Stand', 4, 100.00, '2026-07-10', 'Desk mount stand', 'receipts/2026/07/monitor_stand.png'),

    -- Items for Claim #5
    (9, 5, 'React Rally Conference Pass', 1, 450.00, '2026-08-01', 'Early bird ticket', 'receipts/2026/08/react_rally_ticket.pdf'),
    (10, 5, 'United Flight to Salt Lake City', 1, 400.00, '2026-08-01', 'Flight ticket', 'receipts/2026/08/united_flight.pdf'),

    -- Items for Claim #6
    (11, 6, 'AWS Solutions Architect Voucher', 5, 300.00, '2026-07-22', 'PSI exam registration receipt', 'receipts/2026/07/aws_exam.pdf'),

    -- Items for Claim #7
    (12, 7, '64GB DDR5 ECC Server RAM', 4, 550.00, '2026-07-29', 'Kingston Server RAM kit', 'receipts/2026/07/ram_upgrade.pdf'),

    -- Items for Claim #8
    (13, 8, 'KubeCon Chicago Registration', 1, 800.00, '2026-07-18', 'Conference entry badge', 'receipts/2026/07/kubecon_pass.pdf'),
    (14, 8, 'Hyatt Regency Chicago Stay', 1, 600.00, '2026-07-18', 'Hotel room receipt', 'receipts/2026/07/hyatt_hotel.pdf'),

    -- Items for Claim #9
    (15, 9, 'Manhattan Client Dinner', 2, 380.00, '2026-07-25', 'Client dinner for 4 executives', 'receipts/2026/07/client_dinner.jpg'),

    -- Items for Claim #10
    (16, 10, 'Amtrak Acela Ticket NY-BOS', 1, 180.00, '2026-08-02', 'Train fare', 'receipts/2026/08/amtrak_ticket.pdf'),
    (17, 10, 'Uber Rides in Downtown Boston', 1, 80.00, '2026-08-02', 'Local transport', 'receipts/2026/08/uber_receipts.pdf'),

    -- Items for Claim #11
    (18, 11, 'SF Tech Expo Booth Deposit', 5, 2000.00, '2026-07-12', 'Event booth space deposit receipt', 'receipts/2026/07/booth_deposit.pdf'),

    -- Items for Claim #12
    (19, 12, 'Figma Professional Annual Plan', 3, 180.00, '2026-07-05', 'Design software license', 'receipts/2026/07/figma_invoice.pdf'),

    -- Items for Claim #13
    (20, 13, '10 x $25 Amazon Gift Cards for Testers', 5, 250.00, '2026-07-30', 'User research study rewards', 'receipts/2026/07/giftcards.pdf'),

    -- Items for Claim #14
    (21, 14, 'CPA State Society Annual Dues', 5, 400.00, '2026-07-14', 'Annual dues receipt', 'receipts/2026/07/cpa_dues.pdf'),

    -- Items for Claim #15
    (22, 15, 'Team Catering Lunch at Bistro', 2, 210.00, '2026-07-27', 'Quarterly team lunch bill', 'receipts/2026/07/team_lunch.jpg')
ON DUPLICATE KEY UPDATE item_name=VALUES(item_name), amount=VALUES(amount), s3_object_key=VALUES(s3_object_key);
