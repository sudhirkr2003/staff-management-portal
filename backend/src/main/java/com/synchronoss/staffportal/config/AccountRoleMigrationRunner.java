package com.synchronoss.staffportal.config;

import com.synchronoss.staffportal.entity.User;
import com.synchronoss.staffportal.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class AccountRoleMigrationRunner implements CommandLineRunner {

    private final UserRepository userRepository;

    public AccountRoleMigrationRunner(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            if (user.getRole() == null || !"ADMIN".equalsIgnoreCase(user.getRole().trim())) {
                user.setRole("ADMIN");
                userRepository.save(user);
            }
        }
    }
}

