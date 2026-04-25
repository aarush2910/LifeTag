-- Grant aarush_dev UPDATE permission on cattles (needed for shelter_id assignment)
GRANT SELECT, INSERT, UPDATE, DELETE ON cattles TO aarush_dev;
GRANT SELECT, INSERT, UPDATE, DELETE ON shelters TO aarush_dev;
GRANT SELECT, INSERT, UPDATE, DELETE ON farmers TO aarush_dev;
GRANT SELECT, INSERT, UPDATE, DELETE ON vets TO aarush_dev;
GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO aarush_dev;
GRANT SELECT, INSERT, UPDATE, DELETE ON vet_events TO aarush_dev;
GRANT SELECT, INSERT, UPDATE, DELETE ON vet_health_records TO aarush_dev;
GRANT SELECT, INSERT, UPDATE, DELETE ON vet_availability TO aarush_dev;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO aarush_dev;
GRANT SELECT, INSERT, UPDATE, DELETE ON cattle_complaints TO aarush_dev;
GRANT SELECT, INSERT, UPDATE, DELETE ON shelter_intake_requests TO aarush_dev;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO aarush_dev;
