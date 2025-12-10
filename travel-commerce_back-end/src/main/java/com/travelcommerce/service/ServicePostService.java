package com.travelcommerce.service;

import com.travelcommerce.model.ServicePost;
import com.travelcommerce.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServicePostService {
    @Autowired private ServiceRepository repo;

    public List<ServicePost> findAll() { return repo.findAll(); }
    public ServicePost findById(String id) { return repo.findById(id).orElse(null); }
    public ServicePost create(ServicePost p) { return repo.save(p); }
    public ServicePost update(ServicePost p) { return repo.save(p); }
    public void delete(String id) { repo.deleteById(id); }
}
