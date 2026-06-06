import { classifyComplaint } from '../classification.engine';

describe('ClassificationEngine', () => {

  // ── Department detection ──────────────────────────
  describe('department classification', () => {
    it('should classify water-related complaints as WATER', () => {
      const result = classifyComplaint(
        'Water pipe broken',
        'The water pipe is leaking and causing flooding on our street.',
      );
      expect(result.department).toBe('WATER');
    });

    it('should classify electricity complaints as ELECTRICITY', () => {
      const result = classifyComplaint(
        'Power outage',
        'We have no electricity for 3 days. The transformer is broken.',
      );
      expect(result.department).toBe('ELECTRICITY');
    });

    it('should classify road complaints as ROADS', () => {
      const result = classifyComplaint(
        'Pothole on main road',
        'There is a large dangerous pothole on the street causing accidents.',
      );
      expect(result.department).toBe('ROADS');
    });

    it('should classify health complaints as HEALTH', () => {
      const result = classifyComplaint(
        'Hospital issue',
        'The clinic is not providing medical services to patients.',
      );
      expect(result.department).toBe('HEALTH');
    });

    it('should classify sanitation complaints as SANITATION', () => {
      const result = classifyComplaint(
        'Garbage not collected',
        'The garbage and waste has not been collected for two weeks.',
      );
      expect(result.department).toBe('SANITATION');
    });

    it('should classify security complaints as SECURITY', () => {
      const result = classifyComplaint(
        'Crime in neighbourhood',
        'There is a lot of theft and robbery in our area. Very unsafe.',
      );
      expect(result.department).toBe('SECURITY');
    });

    it('should use override department when provided', () => {
      const result = classifyComplaint(
        'Some issue',
        'Generic description without keywords.',
        'EDUCATION',
      );
      expect(result.department).toBe('EDUCATION');
    });

    it('should default to OTHER for unrecognized complaints', () => {
      const result = classifyComplaint(
        'Random issue',
        'Something happened that does not match any category keywords.',
      );
      expect(result.department).toBe('OTHER');
    });
  });

  // ── Priority detection ────────────────────────────
  describe('priority classification', () => {
    it('should assign CRITICAL priority for emergency keywords', () => {
      const result = classifyComplaint(
        'Emergency water leak',
        'Life threatening water flood emergency in our building.',
      );
      expect(result.priority).toBe('CRITICAL');
    });

    it('should assign HIGH priority for urgent keywords', () => {
      const result = classifyComplaint(
        'Urgent road repair needed',
        'This is urgent, the pothole is very dangerous and needs immediate attention.',
      );
      expect(result.priority).toBe('HIGH');
    });

    it('should assign MEDIUM priority by default', () => {
      const result = classifyComplaint(
        'Water pipe leaking',
        'A water pipe has a small drip in the basement area.',
      );
      expect(result.priority).toBe('MEDIUM');
    });
  });

  // ── SLA hours ─────────────────────────────────────
  describe('SLA hours', () => {
    it('should assign shorter SLA for SECURITY complaints', () => {
      const security = classifyComplaint(
        'Crime report',
        'There is robbery and theft happening in our area.',
      );
      const education = classifyComplaint(
        'School issue',
        'The school teacher is not coming to teach students.',
      );
      expect(security.slaHours).toBeLessThan(education.slaHours);
    });

    it('should assign shorter SLA for CRITICAL priority', () => {
      const critical = classifyComplaint(
        'Emergency water flood',
        'Life threatening flood emergency water.',
      );
      const medium = classifyComplaint(
        'Water pipe dripping',
        'Water pipe is slowly dripping in the basement.',
      );
      expect(critical.slaHours).toBeLessThanOrEqual(medium.slaHours);
    });

    it('should return positive SLA hours', () => {
      const result = classifyComplaint('Test', 'Test description for complaint.');
      expect(result.slaHours).toBeGreaterThan(0);
    });
  });

  // ── Category label ────────────────────────────────
  describe('category label', () => {
    it('should return human-readable category', () => {
      const result = classifyComplaint(
        'Water leak',
        'Water pipe is broken and leaking on our street.',
      );
      expect(result.category).toBe('Water Supply Issue');
    });

    it('should return General Complaint for OTHER department', () => {
      const result = classifyComplaint('Random', 'Something happened.');
      expect(result.category).toBe('General Complaint');
    });
  });
});
