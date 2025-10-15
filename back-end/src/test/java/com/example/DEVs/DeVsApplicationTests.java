package com.example.DEVs;

import com.example.DEVs.controller.CommentController;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigInteger;

@Slf4j
@SpringBootTest
class DeVsApplicationTests {

    private CommentController commentController;

	@Test
	void contextLoads() {
        BigInteger a = BigInteger.valueOf(3);
        BigInteger b = BigInteger.valueOf(353);
        BigInteger mod = BigInteger.valueOf(40);

        for(int i=0;i<1000;i++){
            if(a.pow(i).mod(b).equals(mod)){
                System.out.print(i);
                break;
            }
        }

        BigInteger result = a.modPow(b, mod); // (3^97) mod 353
        System.out.println(result);
	}

}
